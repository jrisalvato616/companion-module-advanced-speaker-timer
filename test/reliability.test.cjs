const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

// Exercise the real module without opening sockets, running Companion's IPC
// entrypoint, or writing generated JavaScript into the project.
const compiled = new Map()
function harness() {
    const sockets = []
    const closed = []
    const timers = new Map()
    const modules = new Map()
    let now = 10_000
    let nextTimer = 0
    class Clock extends Date { static now() { return now } }
    class Socket extends EventEmitter {
        constructor() { super(); this.writes = []; sockets.push(this) }
        connect(port, host) { this.address = { port, host } }
        write(data) { this.writes.push(JSON.parse(data)); return true }
        destroy() { if (!this.destroyed) { this.destroyed = true; closed.push(this) } }
    }
    class InstanceBase {
        constructor() { this.label = 'timer'; this.variables = {}; this.feedbackChecks = 0 }
        log() {}
        updateStatus(status) { this.status = status }
        setActionDefinitions(actions) { this.actions = actions }
        setFeedbackDefinitions(feedbacks) { this.feedbacks = feedbacks }
        setVariableDefinitions() {}
        setPresetDefinitions(presets) { this.presets = presets }
        setVariableValues(values) { Object.assign(this.variables, values) }
        checkFeedbacks() { this.feedbackChecks++ }
    }
    function schedule(fn, delay, repeat) {
        const id = ++nextTimer
        timers.set(id, { fn, at: now + delay, repeat })
        return id
    }
    const base = {
        InstanceBase,
        InstanceStatus: { Connecting: 'connecting', Ok: 'ok', ConnectionFailure: 'failed', Disconnected: 'disconnected' },
        runEntrypoint() {},
        combineRgb: (r, g, b) => (r << 16) | (g << 8) | b,
    }
    function load(name) {
        if (modules.has(name)) return modules.get(name).exports
        const filename = path.join(__dirname, '..', 'src', name + '.ts')
        if (!compiled.has(name)) {
            compiled.set(name, ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
                compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
            }).outputText)
        }
        const module = { exports: {} }
        modules.set(name, module)
        vm.runInNewContext(compiled.get(name), {
            module, exports: module.exports, Buffer, Date: Clock,
            setTimeout: (fn, ms) => schedule(fn, ms, 0),
            clearTimeout: id => timers.delete(id),
            setInterval: (fn, ms) => schedule(fn, ms, ms),
            clearInterval: id => timers.delete(id),
            require: name => name === '@companion-module/base' ? base
                : name === 'net' ? { Socket }
                : name.startsWith('./') ? load(name.slice(2)) : require(name),
        }, { filename })
        return module.exports
    }
    const instance = new (load('index').AdvancedSpeakerTimerInstance)({})
    return {
        instance, sockets,
        async init() {
            await instance.init({ host: '127.0.0.1', port: 18765 })
            sockets.at(-1).emit('connect')
        },
        send(data, socket = sockets.at(-1)) {
            socket.emit('data', Buffer.from(JSON.stringify(data) + '\n'))
        },
        flushClosed() { while (closed.length) closed.shift().emit('close') },
        advance(ms) {
            const end = now + ms
            while (true) {
                const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
                if (!due) break
                const [id, timer] = due
                now = timer.at
                if (timer.repeat) timer.at += timer.repeat
                else timers.delete(id)
                timer.fn()
            }
            now = end
        },
    }
}

function status(overrides = {}) {
    const timer = { state: 'running', currentTime: 10, duration: 300, warningTime: 60, label: 'Talk', displayText: '4:50' }
    return {
        status: 'ok',
        data: { timerA: { ...timer }, timerB: { ...timer }, displayShown: true, timerVisible: true,
            messageIsLive: true, liveMessage: 'Draft', displayedMessage: 'On screen', ...overrides },
    }
}

function commands(socket) { return socket.writes.filter(command => command.action !== 'status') }

test('destroy and its queued socket callbacks never reconnect', async () => {
    const h = harness(); await h.init(); h.send(status())
    const socket = h.sockets[0]
    await h.instance.destroy()
    h.flushClosed()
    socket.emit('error', new Error('late error'))
    socket.emit('connect')
    h.advance(30_000)
    assert.equal(h.sockets.length, 1)
    assert.equal(h.instance.hasCurrentStatus(), false)
    assert.equal(h.instance.variables.connection_status, 'disconnected')
})

test('callbacks from a replaced socket cannot change the new connection', async () => {
    const h = harness(); await h.init(); h.send(status())
    const old = h.sockets[0]
    await h.instance.configUpdated({ host: '192.0.2.1', port: 20000 })
    const current = h.sockets[1]
    current.emit('connect'); h.send(status({ liveMessage: 'New connection' }))
    h.send(status({ liveMessage: 'Old connection' }), old)
    old.emit('error', new Error('old error')); old.emit('connect'); h.flushClosed()
    assert.equal(h.instance.hasCurrentStatus(), true)
    assert.equal(h.instance.variables.live_message, 'New connection')
    assert.equal(h.instance.status, 'ok')
    h.advance(5000)
    assert.equal(h.sockets.length, 2)
})

test('error and close create only one reconnect, cancelled by destruction', async () => {
    const h = harness(); await h.init()
    h.sockets[0].emit('error', new Error('lost'))
    h.flushClosed(); h.advance(5000)
    assert.equal(h.sockets.length, 2)
    h.sockets[1].emit('error', new Error('unreachable'))
    h.flushClosed(); await h.instance.destroy(); h.advance(30_000)
    assert.equal(h.sockets.length, 2)
})

test('disconnect clears live values and reevaluates button feedback', async () => {
    const h = harness(); await h.init(); h.send(status())
    const before = h.instance.feedbackChecks
    h.sockets[0].emit('close')
    assert.equal(h.instance.getAppStatus(), null)
    assert.equal(h.instance.variables.timer_a_state, 'unavailable')
    assert.equal(h.instance.variables.timer_a_remaining_time_formatted, 'Unavailable')
    assert.equal(h.instance.variables.displayed_message, '')
    assert.equal(h.instance.feedbacks.timer_a_running.callback({}), false)
    assert.equal(h.instance.feedbacks.connection_unavailable.callback({}), true)
    assert.ok(h.instance.feedbackChecks > before)
})

test('silent connections become unavailable and recover on fresh status', async () => {
    const h = harness(); await h.init(); h.send(status())
    h.advance(5000)
    assert.equal(h.instance.getAppStatus(), null)
    assert.equal(h.instance.variables.connection_status, 'stale')
    assert.equal(h.instance.variables.timer_a_remaining_time_formatted, 'Unavailable')
    assert.ok(h.sockets[0].writes.filter(c => c.action === 'status').length > 1)
    h.send(status())
    assert.equal(h.instance.hasCurrentStatus(), true)
    assert.equal(h.instance.variables.connection_status, 'connected')
    assert.equal(h.instance.variables.timer_a_remaining_time_formatted, '4:50')
})

test('connection awaiting its first status times out too', async () => {
    const h = harness(); await h.init()
    assert.equal(h.instance.variables.connection_status, 'waiting')
    h.advance(5000)
    assert.equal(h.instance.variables.connection_status, 'stale')
})

test('accented characters and emoji survive every TCP split boundary', async () => {
    const h = harness(); await h.init()
    const data = Buffer.from(JSON.stringify({ action: 'timerPresets', presets: [{ id: 'a', name: 'José 🎤', duration: 300 }] }) + '\n')
    for (let split = 1; split < data.length; split++) {
        h.sockets[0].emit('data', data.subarray(0, split))
        h.sockets[0].emit('data', data.subarray(split))
        assert.equal(h.instance.getTimerPresets()[0].name, 'José 🎤')
    }
})

test('toggle uses server capability and legacy fallback follows current state', async () => {
    const h = harness(); await h.init()
    const socket = h.sockets[0]
    h.send(status({ capabilities: ['toggleTimer'] })); socket.writes = []
    h.instance.toggleTimer('A')
    assert.deepEqual(commands(socket), [{ action: 'toggleTimer', timer: 'A' }])
    h.send(status()); socket.writes = []
    h.instance.toggleTimer('B')
    assert.deepEqual(commands(socket), [{ action: 'pause', timer: 'B' }])
    const ready = status(); ready.data.timerB.state = 'ready'
    h.send(ready); socket.writes = []; h.instance.toggleTimer('B')
    assert.deepEqual(commands(socket), [{ action: 'start', timer: 'B' }])
})

test('toggle refuses to guess while status is unavailable', async () => {
    const h = harness(); await h.init(); h.send(status()); h.advance(5000)
    h.sockets[0].writes = []; h.instance.toggleTimer('A')
    assert.deepEqual(commands(h.sockets[0]), [])
    assert.equal(h.sockets[0].writes[0].action, 'status')
})

test('stock start/pause buttons use one state-aware action and unavailable feedback', async () => {
    const h = harness(); await h.init()
    for (const timer of ['a', 'b']) {
        const button = h.instance.presets[`timer_${timer}_start_pause`]
        assert.equal(button.steps.length, 1)
        assert.equal(button.steps[0].down[0].actionId, `toggle_timer_${timer}`)
        assert.equal(button.feedbacks.at(-1).feedbackId, 'connection_unavailable')
    }
})

test('draft and on-screen messages are distinct, and old apps do not invent displayed text', async () => {
    const h = harness(); await h.init(); h.send(status())
    assert.equal(h.instance.variables.live_message, 'Draft')
    assert.equal(h.instance.variables.displayed_message, 'On screen')
    const old = status(); delete old.data.displayedMessage; h.send(old)
    assert.equal(h.instance.variables.displayed_message, '')
    h.send(status({ messageIsLive: false }))
    assert.equal(h.instance.variables.displayed_message, '')
})


test('preset selection follows identity through reorders and clamps after deletion', async () => {
    const h = harness(); await h.init()
    const a = { id: 'a', name: 'Opening', duration: 60 }, b = { id: 'b', name: 'Talk', duration: 300 }
    h.send({ action: 'timerPresets', presets: [a, b] })
    h.instance.moveTimerPresetHighlight(1)
    h.send({ action: 'timerPresets', presets: [b, a] })
    assert.equal(h.instance.highlightedTimerPresetInfo().id, 'b')
    assert.equal(h.instance.variables.selected_timer_preset_number, '1/2')
    h.send({ action: 'timerPresets', presets: [a] })
    assert.equal(h.instance.highlightedTimerPresetInfo().id, 'a')
    h.instance.moveTimerPresetHighlight(-1)
    assert.equal(h.instance.highlightedTimerPresetInfo().id, 'a')
})

test('reconnect hides old preset catalogs until fresh lists arrive', async () => {
    const h = harness(); await h.init()
    h.send({ action: 'timerPresets', presets: [{ id: 'old', name: 'Old app', duration: 60 }] })
    h.send({ action: 'messagePresets', presets: [{ id: 'msg', name: 'Old draft' }] })
    await h.instance.configUpdated({ host: '192.0.2.1', port: 18765 })
    assert.equal(h.instance.getTimerPresets().length, 0)
    assert.equal(h.instance.getMessagePresets().length, 0)
    assert.equal(h.instance.highlightedTimerPresetInfo(), undefined)
    assert.equal(h.instance.highlightedMessagePresetInfo(), undefined)
    assert.equal(h.instance.variables.selected_timer_preset_number, '0/0')
    assert.equal(h.instance.variables.selected_message_preset_number, '0/0')
    assert.equal(h.instance.actions.recall_timer_preset_a.options[0].choices.length, 0)
    assert.ok(!Object.keys(h.instance.presets).some(key => key.includes('old')))
    h.sockets[1].emit('connect')
    h.send({ action: 'timerPresets', presets: [{ id: 'new', name: 'New app', duration: 120 }] })
    assert.equal(h.instance.highlightedTimerPresetInfo().id, 'new')
})

test('send draft resolves in the app after preset recall instead of sending cached text', async () => {
    const h = harness(); await h.init(); h.send(status({ capabilities: ['showMessage'] }))
    const socket = h.sockets[0]; socket.writes = []
    h.instance.sendCommand({ action: 'recallMessagePreset', presetId: 'new-draft' })
    h.instance.actions.send_message.callback({ options: {} })
    assert.deepEqual(commands(socket), [
        { action: 'recallMessagePreset', presetId: 'new-draft' }, { action: 'showMessage' },
    ])
})

test('send draft never guesses on old apps or stale status', async () => {
    const h = harness(); await h.init(); h.send(status())
    const socket = h.sockets[0]; socket.writes = []
    h.instance.sendDraftMessage()
    assert.deepEqual(commands(socket), [])
    h.send(status({ capabilities: ['showMessage'] })); h.advance(5000); socket.writes = []
    h.instance.sendDraftMessage()
    assert.deepEqual(commands(socket), [])
    assert.equal(socket.writes[0].action, 'status')
})
