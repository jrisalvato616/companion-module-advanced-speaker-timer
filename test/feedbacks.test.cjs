const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

function load(name) {
    const filename = path.join(__dirname, '..', 'src', `${name}.ts`)
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    }).outputText
    const module = { exports: {} }
    vm.runInNewContext(source, {
        module, exports: module.exports,
        require: name => name === '@companion-module/base'
            ? { combineRgb: (r, g, b) => (r << 16) | (g << 8) | b }
            : name.startsWith('./') ? load(name.slice(2)) : require(name),
    }, { filename })
    return module.exports
}
const { GetFeedbacksList } = load('feedbacks')
const { GetVariableValues, GetUnavailableVariableValues, GetVariableDefinitions, formatTime } = load('variables')
function status(timerOverrides = {}, overrides = {}) {
    const timer = { state: 'running', currentTime: 250, duration: 300, warningTime: 60, label: 'Talk', mode: 'Countdown' }
    return { timerA: { ...timer, ...timerOverrides }, timerB: { ...timer, ...timerOverrides },
        displayShown: true, timerVisible: true, messageIsLive: false, liveMessage: 'Draft',
        layout: 'Single Timer', ...overrides }
}
function feedbacks(data) {
    return GetFeedbacksList({ getAppStatus: () => data, hasCurrentStatus: () => data !== null })
}
function evaluate(definition, options = {}) { return definition.callback({ options }) }

for (const timer of ['a', 'b']) {
    test(`Timer ${timer.toUpperCase()} legacy warnings agree with the app across states and timer types`, () => {
        const warning = data => evaluate(feedbacks(data)[`timer_${timer}_warning`])
        assert.equal(warning(status()), true)
        assert.equal(warning(status({ currentTime: 240 })), true)
        assert.equal(warning(status({ currentTime: 239 })), false)
        assert.equal(warning(status({ currentTime: 300 })), false)
        assert.equal(warning(status({ state: 'paused' })), false)
        assert.equal(warning(status({ state: 'ready' })), false)
        assert.equal(warning(status({ mode: 'Count Up' })), false)
        assert.equal(warning(status({ isWarning: false })), false)
        // A target-time timer's authoritative app flag wins over an old duration.
        assert.equal(warning(status({ mode: 'Countdown to Time', currentTime: 0, isWarning: true })), true)
    })

    test(`Timer ${timer.toUpperCase()} overtime does not depend on raw state while counting past zero`, () => {
        const overtime = data => evaluate(feedbacks(data)[`timer_${timer}_overtime`])
        assert.equal(overtime(status({ state: 'running', currentTime: 330, isOvertime: true })), true)
        assert.equal(overtime(status({ state: 'paused', currentTime: 330, isOvertime: true })), true)
        assert.equal(overtime(status({ state: 'finished', currentTime: 300, isOvertime: false })), false)
        assert.equal(overtime(status({ state: 'overtime' })), true)
    })
}

test('state feedback distinguishes each timer and stopped overtime from running overtime', () => {
    const definitions = feedbacks(status({ state: 'running', isOvertime: true }, {
        timerB: { ...status().timerB, state: 'finished' },
    }))
    assert.equal(evaluate(definitions.timer_state, { timer: 'A', state: 'running' }), true)
    assert.equal(evaluate(definitions.timer_state, { timer: 'A', state: 'overtime' }), false)
    assert.equal(evaluate(definitions.timer_state, { timer: 'B', state: 'finished' }), true)
    assert.equal(evaluate(definitions.timer_state, { timer: 'B', state: 'ready' }), false)
    assert.equal(evaluate(definitions.timer_state, { timer: 'invalid', state: 'ready' }), false)
})

test('unavailable data never lights live state, layout, output or message feedback', () => {
    const definitions = feedbacks(null)
    for (const [id, definition] of Object.entries(definitions)) {
        assert.equal(evaluate(definition, { timer: 'A', state: 'ready', layout: 'Single Timer' }), id === 'connection_unavailable', id)
    }
})

test('output enable, timer visibility and on-air message remain separate feedbacks', () => {
    const definitions = feedbacks(status({}, { displayShown: false, timerVisible: true, messageIsLive: true }))
    assert.equal(evaluate(definitions.display_visible), false)
    assert.equal(evaluate(definitions.timer_visible), true)
    assert.equal(evaluate(definitions.message_live), true)
    assert.equal(evaluate(feedbacks(status({}, { timerVisible: undefined })).timer_visible), false)
    assert.equal(GetVariableValues(status({}, { timerVisible: undefined })).timer_visible, '')
})

test('layout feedback accepts the historical Clock and Timer spelling', () => {
    for (const layout of ['Clock and Timer', 'Clock + Timer']) {
        assert.equal(evaluate(feedbacks(status({}, { layout })).timer_mode, { layout: 'Clock and Timer' }), true)
    }
    assert.equal(evaluate(feedbacks(status({}, { layout: undefined })).timer_mode, { layout: 'Single Timer' }), false)
})

test('display variables preserve the app text and legacy button aliases in countdown and overtime', () => {
    const values = GetVariableValues(status({ displayText: '+0:30', currentTime: 330, remainingTime: -30 }))
    for (const timer of ['a', 'b']) {
        assert.equal(values[`timer_${timer}_display_text`], '+0:30')
        assert.equal(values[`timer_${timer}_remaining_time_formatted`], '+0:30')
        assert.equal(values[`timer_${timer}_remaining_time`], -30)
        assert.equal(values[`timer_${timer}_mode`], 'Countdown')
    }
})

test('Count Up displays elapsed time and has no misleading remaining deadline', () => {
    const values = GetVariableValues(status({ mode: 'Count Up', currentTime: 90, remainingTime: null, displayText: '1:30' }))
    assert.equal(values.timer_a_display_text, '1:30')
    assert.equal(values.timer_a_remaining_time, '')
    const legacy = GetVariableValues(status({ mode: 'Count Up', currentTime: 90 }))
    assert.equal(legacy.timer_a_display_text, '1:30')
    assert.equal(legacy.timer_a_remaining_time, '')
})

test('target countdown uses the actual target interval even before starting', () => {
    const values = GetVariableValues(status({ state: 'ready', mode: 'Countdown to Time', duration: 300,
        currentTime: 0, remainingTime: 7200, displayText: '2:00:00' }))
    assert.equal(values.timer_a_remaining_time, 7200)
    assert.equal(values.timer_a_display_text, '2:00:00')
})

test('older app display fallback and signed hour formatting remain usable', () => {
    const values = GetVariableValues(status({ currentTime: 30, duration: 90 }))
    assert.equal(values.timer_a_display_text, '1:00')
    assert.equal(values.timer_a_remaining_time, 60)
    assert.equal(formatTime(3601), '1:00:01')
    assert.equal(formatTime(-3601), '-1:00:01')
})

test('disconnect clears added display/type variables and every emitted variable is declared', () => {
    const definitions = new Set(GetVariableDefinitions().map(d => d.variableId))
    const offline = GetUnavailableVariableValues()
    assert.equal(offline.timer_a_display_text, 'Unavailable')
    assert.equal(offline.timer_b_display_text, 'Unavailable')
    assert.equal(offline.timer_a_mode, '')
    for (const id of Object.keys({ ...GetVariableValues(status()), ...offline })) assert.ok(definitions.has(id), id)
})
