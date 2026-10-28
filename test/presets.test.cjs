const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

const compiled = new Map()
const rgb = (r, g, b) => (r << 16) | (g << 8) | b
function load(name) {
    if (compiled.has(name)) return compiled.get(name)
    const filename = path.join(__dirname, '..', 'src', name + '.ts')
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    }).outputText
    const module = { exports: {} }
    vm.runInNewContext(source, {
        module, exports: module.exports,
        require: name => name === '@companion-module/base' ? { combineRgb: rgb }
            : name.startsWith('./') ? load(name.slice(2)) : require(name),
    }, { filename })
    compiled.set(name, module.exports)
    return module.exports
}

function catalog() {
    const commands = []
    const instance = {
        label: 'speaker', available: true,
        status: { timerA: { state: 'ready', isWarning: false, isOvertime: false },
            timerB: { state: 'ready', isWarning: false, isOvertime: false } },
        getTimerPresets: () => [{ id: 'talk-short', name: 'Talk', duration: 300 },
            { id: 'talk-long', name: 'Talk', duration: 600 }],
        getMessagePresets: () => [{ id: 'message-id', name: 'Wrap up' }],
        hasCurrentStatus() { return this.available },
        getAppStatus() { return this.available ? this.status : null },
        sendCommand(command) { commands.push(JSON.parse(JSON.stringify(command))) },
        sendDraftMessage() { commands.push({ action: 'showMessage' }) },
    }
    return {
        instance, commands,
        presets: load('presets').GetPresetList(instance),
        actions: load('actions').GetActionsList(instance),
        feedbacks: load('feedbacks').GetFeedbacksList(instance),
        variables: new Set(load('variables').GetVariableDefinitions().map(v => v.variableId)),
    }
}

function checkOptions(options, definition, location) {
    for (const [key, value] of Object.entries(options)) {
        const option = definition.options.find(option => option.id === key)
        assert.ok(option, `${location} has unknown option ${key}`)
        if (option.type === 'dropdown') {
            assert.ok(option.choices.some(choice => choice.id === value),
                `${location} has unsupported ${key}: ${value}`)
        }
    }
}

test('every stock preset references existing actions, feedbacks, options and variables', () => {
    const c = catalog()
    for (const [id, preset] of Object.entries(c.presets)) {
        for (const match of preset.style.text.matchAll(/\$\(speaker:([^)]*)\)/g)) {
            assert.ok(c.variables.has(match[1]), `${id} references missing variable ${match[1]}`)
        }
        for (const step of preset.steps) {
            for (const event of ['down', 'up', 'rotate_left', 'rotate_right']) {
                for (const action of step[event] ?? []) {
                    const definition = c.actions[action.actionId]
                    assert.ok(definition, `${id} references missing action ${action.actionId}`)
                    checkOptions(action.options, definition, id)
                }
            }
        }
        for (const feedback of preset.feedbacks) {
            const definition = c.feedbacks[feedback.feedbackId]
            assert.ok(definition, `${id} references missing feedback ${feedback.feedbackId}`)
            checkOptions(feedback.options, definition, id)
        }
        assert.equal(preset.feedbacks.at(-1).feedbackId, 'connection_unavailable',
            `${id} must show unavailable above any old live state`)
    }
})

test('same-name timer preset buttons keep their UUID and timer target, and messages only load drafts', () => {
    const c = catalog()
    for (const timer of ['a', 'b']) {
        for (const presetId of ['talk-short', 'talk-long']) {
            const preset = c.presets[`timer_preset_${timer}_${presetId}`]
            for (const action of preset.steps[0].down) c.actions[action.actionId].callback(action)
            assert.deepEqual(c.commands.pop(), {
                action: 'recallTimerPreset', timer: timer.toUpperCase(), presetId,
            })
        }
    }
    const message = c.presets['message_preset_message-id']
    for (const action of message.steps[0].down) c.actions[action.actionId].callback(action)
    assert.deepEqual(c.commands, [{ action: 'recallMessagePreset', presetId: 'message-id' }])
})

function buttonStyle(c, id) {
    const preset = c.presets[id]
    const style = { ...preset.style }
    for (const feedback of preset.feedbacks) {
        if (c.feedbacks[feedback.feedbackId].callback(feedback)) Object.assign(style, feedback.style)
    }
    return style
}

test('live display priorities distinguish warning, overtime, finished and unavailable states', () => {
    const c = catalog()
    for (const timer of ['A', 'B']) {
        const id = `timer_${timer.toLowerCase()}_countdown`
        c.instance.status[`timer${timer}`] = { state: 'running', isWarning: false, isOvertime: false }
        assert.equal(buttonStyle(c, id).color, rgb(0, 220, 80))
        c.instance.status[`timer${timer}`].isWarning = true
        assert.equal(buttonStyle(c, id).color, rgb(255, 165, 0))
        c.instance.status[`timer${timer}`].isOvertime = true
        assert.equal(buttonStyle(c, id).color, rgb(255, 40, 40))
        c.instance.status[`timer${timer}`] = { state: 'finished', isWarning: false, isOvertime: false }
        assert.equal(buttonStyle(c, id).color, rgb(255, 40, 40))
        c.instance.available = false
        assert.equal(buttonStyle(c, id).bgcolor, rgb(80, 80, 80))
        assert.equal(buttonStyle(c, id).color, rgb(255, 255, 255))
        c.instance.available = true
    }
})


test('clear message preset is idempotent and reflects whether a message is live', () => {
    const c = catalog()
    const button = c.presets.hide_message
    for (const live of [true, false]) {
        c.instance.status.messageIsLive = live
        for (const action of button.steps[0].down) c.actions[action.actionId].callback(action)
        assert.deepEqual(c.commands.pop(), { action: 'clearMessage' })
        assert.equal(buttonStyle(c, 'hide_message').bgcolor, live ? rgb(200, 0, 0) : rgb(20, 20, 20))
    }
})


test('Send Draft uses the deterministic send action whether or not a message is already live', () => {
    const c = catalog()
    const button = c.presets.send_message
    for (const live of [false, true]) {
        c.instance.status.messageIsLive = live
        for (const action of button.steps[0].down) c.actions[action.actionId].callback(action)
        assert.deepEqual(c.commands.pop(), { action: 'showMessage' })
        assert.equal(buttonStyle(c, 'send_message').bgcolor, live ? rgb(200, 0, 0) : rgb(20, 20, 20))
    }
})
