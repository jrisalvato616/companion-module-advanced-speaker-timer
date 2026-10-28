const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

const modules = new Map()
function load(name) {
    if (modules.has(name)) return modules.get(name).exports
    const filename = path.join(__dirname, '..', 'src', name + '.ts')
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    }).outputText
    const module = { exports: {} }
    modules.set(name, module)
    vm.runInNewContext(source, {
        module, exports: module.exports,
        require: name => name.startsWith('./') ? load(name.slice(2)) : require(name),
    }, { filename })
    return module.exports
}
const { GetActionsList } = load('actions')

function harness() {
    const commands = [], calls = [], warnings = []
    const state = { timerA: { mode: 'Countdown' }, timerB: { mode: 'Countdown' } }
    const instance = {
        getTimerPresets: () => [{ id: 'timer-1', name: 'Talk' }],
        getMessagePresets: () => [{ id: 'message-1', name: 'Wrap up' }],
        getAppStatus: () => state,
        sendCommand: command => commands.push(JSON.parse(JSON.stringify(command))),
        toggleTimer: timer => calls.push(['toggle', timer]),
        sendDraftMessage: () => commands.push({ action: 'showMessage' }),
        requestStatus: () => calls.push(['status']),
        moveTimerPresetHighlight: step => calls.push(['timerHighlight', step]),
        moveMessagePresetHighlight: step => calls.push(['messageHighlight', step]),
        highlightedTimerPresetInfo: () => ({ id: 'timer-1' }),
        highlightedMessagePresetInfo: () => ({ id: 'message-1' }),
        log: (level, text) => warnings.push([level, text]),
    }
    const actions = GetActionsList(instance)
    return { actions, commands, calls, warnings, state, instance,
        async invoke(id, options = {}, parse = async value => value) {
            await actions[id].callback({ options }, { parseVariablesInString: parse })
        },
    }
}

test('explicit timer controls and visibility actions send their intended commands', async () => {
    const h = harness()
    for (const timer of ['A', 'B']) {
        for (const action of ['start', 'pause', 'reset']) {
            await h.invoke(`${action}_timer_${timer.toLowerCase()}`)
            assert.deepEqual(h.commands.pop(), { action, timer })
        }
    }
    for (const [id, action] of Object.entries({
        show_display: 'showDisplay', hide_display: 'hideDisplay', toggle_display: 'toggleDisplay',
        show_timer: 'showTimer', hide_timer: 'hideTimer', toggle_timer_visible: 'toggleTimerVisible',
        toggle_message: 'toggleMessage', hide_message: 'clearMessage',
    })) {
        await h.invoke(id)
        assert.deepEqual(h.commands.pop(), { action })
    }
})

test('toggle and rotary actions use the state-aware helpers and selected preset', async () => {
    const h = harness()
    for (const timer of ['a', 'b']) await h.invoke(`toggle_timer_${timer}`)
    await h.invoke('select_next_timer_preset')
    await h.invoke('select_previous_timer_preset')
    await h.invoke('select_next_message_preset')
    await h.invoke('select_previous_message_preset')
    await h.invoke('request_status')
    assert.deepEqual(h.calls, [['toggle', 'A'], ['toggle', 'B'], ['timerHighlight', 1],
        ['timerHighlight', -1], ['messageHighlight', 1], ['messageHighlight', -1], ['status']])
    await h.invoke('recall_highlighted_timer_preset', { timer: 'B' })
    await h.invoke('recall_highlighted_message_preset')
    assert.deepEqual(h.commands, [{ action: 'recallTimerPreset', timer: 'B', presetId: 'timer-1' },
        { action: 'recallMessagePreset', presetId: 'message-1' }])
    h.instance.highlightedTimerPresetInfo = () => undefined
    h.instance.highlightedMessagePresetInfo = () => undefined
    await h.invoke('recall_highlighted_timer_preset', { timer: 'A' })
    await h.invoke('recall_highlighted_message_preset')
    assert.equal(h.commands.length, 2)
})

test('adjustments encode whole seconds and reject values the Swift parser cannot use', async () => {
    const h = harness()
    for (const timer of ['A', 'B']) {
        for (const seconds of [-3600, '-30', 0, 60, 3600]) {
            await h.invoke(`adjust_timer_${timer.toLowerCase()}`, { seconds })
            assert.deepEqual(h.commands.pop(), { action: 'adjust', timer, value: String(seconds) })
        }
        for (const seconds of [undefined, null, '', ' ', false, NaN, Infinity, 1.5, '1.5', 3601, -3601, 'no']) {
            await h.invoke(`adjust_timer_${timer.toLowerCase()}`, { seconds })
        }
    }
    assert.equal(h.commands.length, 0)
    assert.equal(h.warnings.length, 24)
})

test('quick adjustments preserve their amounts and ignore Count Up elapsed timers', async () => {
    const h = harness()
    for (const timer of ['A', 'B']) {
        for (const [prefix, value] of [['add_30s', '30'], ['add_1m', '60'], ['sub_30s', '-30'], ['sub_1m', '-60']]) {
            await h.invoke(`${prefix}_timer_${timer.toLowerCase()}`)
            assert.deepEqual(h.commands.pop(), { action: 'adjust', timer, value })
        }
        h.state[`timer${timer}`].mode = 'Count Up'
        await h.invoke(`add_1m_timer_${timer.toLowerCase()}`)
        await h.invoke(`adjust_timer_${timer.toLowerCase()}`, { seconds: -30 })
    }
    assert.equal(h.commands.length, 0)
    assert.equal(h.warnings.length, 4)
    h.state.timerA.mode = 'Countdown to Time'
    await h.invoke('adjust_timer_a', { seconds: 60 })
    assert.deepEqual(h.commands.pop(), { action: 'adjust', timer: 'A', value: '60' })
})

test('message actions resolve variables, preserve Unicode and keep sending explicit', async () => {
    const h = harness()
    const source = 'Next: $(custom:speaker)\n🎤'
    let parsed = false
    await h.invoke('set_message', { message: source, send: true }, async text => {
        assert.equal(text, source)
        await Promise.resolve()
        parsed = true
        return text.replace('$(custom:speaker)', 'José')
    })
    assert.equal(parsed, true)
    assert.deepEqual(h.commands.pop(), { action: 'setMessage', message: 'Next: José\n🎤', send: true })
    await h.invoke('set_message', { message: '', send: false })
    assert.deepEqual(h.commands.pop(), { action: 'setMessage', message: '', send: false })
    await h.invoke('set_message', { message: 'Draft', send: 'false' })
    assert.equal(h.commands.pop().send, false)
    await h.invoke('set_message', {})
    assert.equal(h.commands.length, 0)
    assert.equal(h.warnings.length, 1)
    assert.equal(h.actions.set_message.options.find(option => option.id === 'message').useVariables, true)
})

test('preset actions reject absent selections and preserve valid preset IDs', async () => {
    const h = harness()
    for (const id of ['recall_timer_preset_a', 'recall_timer_preset_b', 'recall_message_preset']) {
        for (const presetId of [undefined, null, '', '  ', 12]) await h.invoke(id, { presetId })
    }
    assert.equal(h.commands.length, 0)
    await h.invoke('recall_timer_preset_a', { presetId: 'timer-1' })
    await h.invoke('recall_timer_preset_b', { presetId: 'timer-1' })
    await h.invoke('recall_message_preset', { presetId: 'message-1' })
    assert.deepEqual(h.commands, [{ action: 'recallTimerPreset', timer: 'A', presetId: 'timer-1' },
        { action: 'recallTimerPreset', timer: 'B', presetId: 'timer-1' },
        { action: 'recallMessagePreset', presetId: 'message-1' }])
})

test('layout aliases stay compatible while invalid choices never reach the app', async () => {
    const h = harness()
    for (const layout of ['Single Timer', 'Dual Timers', 'Clock Only', 'Clock + Timer', 'Clock and Timer']) {
        await h.invoke('set_layout', { layout })
        assert.deepEqual(h.commands.pop(), { action: 'setLayout', layout: layout === 'Clock and Timer' ? 'Clock + Timer' : layout })
    }
    for (const layout of [undefined, '', 'Unknown mode']) await h.invoke('set_layout', { layout })
    assert.equal(h.commands.length, 0)
})

const swiftAppSource = path.join(__dirname, '..', '..', 'Advanced Speaker Timer', 'ContentView.swift')
test('every emitted command has a handler in the copied Swift app', { skip: !fs.existsSync(swiftAppSource) }, async () => {
    const h = harness()
    for (const [id, action] of Object.entries(h.actions)) {
        const options = Object.fromEntries(action.options.map(option => [option.id, option.default]))
        await h.invoke(id, options)
    }
    const swift = fs.readFileSync(swiftAppSource, 'utf8')
    const handlers = new Set([...swift.matchAll(/case "([^"]+)":/g)].map(match => match[1]))
    for (const command of h.commands) assert.ok(handlers.has(command.action), `No app handler for ${command.action}`)
})
