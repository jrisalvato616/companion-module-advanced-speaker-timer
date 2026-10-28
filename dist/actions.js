"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetActionsList = void 0;
const timerModes_1 = require("./timerModes");
function GetActionsList(instance) {
    var _a, _b, _c, _d, _e, _f;
    const timerPresetChoices = instance.getTimerPresets().map((p) => ({ id: p.id, label: p.name }));
    const messagePresetChoices = instance.getMessagePresets().map((p) => ({ id: p.id, label: p.name }));
    // Companion's field limits are UI hints; imported/edited buttons can still
    // contain missing, fractional or non-finite values that the app cannot parse.
    const adjustTimer = (timer, value) => {
        const seconds = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')
            ? Number(value) : NaN;
        if (!Number.isInteger(seconds) || seconds < -3600 || seconds > 3600) {
            instance.log('warn', 'Timer adjustment must be a whole number of seconds between -3600 and 3600');
            return;
        }
        const status = instance.getAppStatus();
        const mode = timer === 'A' ? status === null || status === void 0 ? void 0 : status.timerA.mode : status === null || status === void 0 ? void 0 : status.timerB.mode;
        if (mode === 'Count Up') {
            instance.log('warn', 'Time adjustments apply to countdown timers, not Count Up elapsed time');
            return;
        }
        instance.sendCommand({ action: 'adjust', timer, value: String(seconds) });
    };
    const recallPreset = (value, timer) => {
        if (typeof value !== 'string' || value.trim() === '') {
            instance.log('warn', 'Choose a preset before recalling it');
            return;
        }
        instance.sendCommand(timer
            ? { action: 'recallTimerPreset', timer, presetId: value }
            : { action: 'recallMessagePreset', presetId: value });
    };
    return {
        toggle_timer_a: {
            name: 'Start / Pause Timer A',
            description: 'Toggle Timer A using its current state',
            options: [],
            callback: () => instance.toggleTimer('A'),
        },
        toggle_timer_b: {
            name: 'Start / Pause Timer B',
            description: 'Toggle Timer B using its current state',
            options: [],
            callback: () => instance.toggleTimer('B'),
        },
        start_timer_a: {
            name: 'Start Timer A',
            description: 'Start Timer A',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'start', timer: 'A' });
            },
        },
        pause_timer_a: {
            name: 'Pause Timer A',
            description: 'Pause Timer A',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'pause', timer: 'A' });
            },
        },
        reset_timer_a: {
            name: 'Reset Timer A',
            description: 'Reset Timer A',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'reset', timer: 'A' });
            },
        },
        start_timer_b: {
            name: 'Start Timer B',
            description: 'Start Timer B',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'start', timer: 'B' });
            },
        },
        pause_timer_b: {
            name: 'Pause Timer B',
            description: 'Pause Timer B',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'pause', timer: 'B' });
            },
        },
        reset_timer_b: {
            name: 'Reset Timer B',
            description: 'Reset Timer B',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'reset', timer: 'B' });
            },
        },
        adjust_timer_a: {
            name: 'Adjust Timer A Countdown',
            description: 'Adjust Timer A countdown duration or clock deadline. Count Up elapsed time is unchanged.',
            options: [
                {
                    id: 'seconds',
                    type: 'number',
                    label: 'Seconds to add/subtract',
                    default: 30,
                    min: -3600,
                    max: 3600,
                    step: 1,
                },
            ],
            callback: (event) => {
                adjustTimer('A', event.options.seconds);
            },
        },
        adjust_timer_b: {
            name: 'Adjust Timer B Countdown',
            description: 'Adjust Timer B countdown duration or clock deadline. Count Up elapsed time is unchanged.',
            options: [
                {
                    id: 'seconds',
                    type: 'number',
                    label: 'Seconds to add/subtract',
                    default: 30,
                    min: -3600,
                    max: 3600,
                    step: 1,
                },
            ],
            callback: (event) => {
                adjustTimer('B', event.options.seconds);
            },
        },
        add_30s_timer_a: {
            name: 'Add 30s to Timer A',
            description: 'Add 30 seconds to Timer A countdown duration or deadline',
            options: [],
            callback: (event) => {
                adjustTimer('A', 30);
            },
        },
        add_1m_timer_a: {
            name: 'Add 1min to Timer A',
            description: 'Add 1 minute to Timer A countdown duration or deadline',
            options: [],
            callback: (event) => {
                adjustTimer('A', 60);
            },
        },
        sub_30s_timer_a: {
            name: 'Remove 30s from Timer A',
            description: 'Remove 30 seconds from Timer A countdown duration or deadline',
            options: [],
            callback: (event) => {
                adjustTimer('A', -30);
            },
        },
        sub_1m_timer_a: {
            name: 'Remove 1min from Timer A',
            description: 'Remove 1 minute from Timer A countdown duration or deadline',
            options: [],
            callback: (event) => {
                adjustTimer('A', -60);
            },
        },
        add_30s_timer_b: {
            name: 'Add 30s to Timer B',
            description: 'Add 30 seconds to Timer B countdown duration or deadline',
            options: [],
            callback: (event) => {
                adjustTimer('B', 30);
            },
        },
        add_1m_timer_b: {
            name: 'Add 1min to Timer B',
            description: 'Add 1 minute to Timer B countdown duration or deadline',
            options: [],
            callback: (event) => {
                adjustTimer('B', 60);
            },
        },
        sub_30s_timer_b: {
            name: 'Remove 30s from Timer B',
            description: 'Remove 30 seconds from Timer B countdown duration or deadline',
            options: [],
            callback: (event) => {
                adjustTimer('B', -30);
            },
        },
        sub_1m_timer_b: {
            name: 'Remove 1min from Timer B',
            description: 'Remove 1 minute from Timer B countdown duration or deadline',
            options: [],
            callback: (event) => {
                adjustTimer('B', -60);
            },
        },
        show_display: {
            name: 'Enable Output',
            description: 'Put the output window up on the external display',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'showDisplay' });
            },
        },
        hide_display: {
            name: 'Disable Output',
            description: 'Take the output window down and release the display',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'hideDisplay' });
            },
        },
        toggle_display: {
            name: 'Toggle Output',
            description: 'Toggle the output window on the external display',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'toggleDisplay' });
            },
        },
        show_timer: {
            name: 'Show Timer',
            description: 'Show the timer over the background',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'showTimer' });
            },
        },
        hide_timer: {
            name: 'Hide Timer',
            description: 'Hide the timer, leaving the background on screen',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'hideTimer' });
            },
        },
        toggle_timer_visible: {
            name: 'Toggle Timer Visibility',
            description: 'Show or hide the timer without taking the output down',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'toggleTimerVisible' });
            },
        },
        send_message: {
            name: 'Send Draft Message',
            description: 'Send the current draft, replacing any live message. Requires the updated app.',
            options: [],
            callback: () => instance.sendDraftMessage(),
        },
        toggle_message: {
            name: 'Toggle Live Message',
            description: 'Toggle the live message display',
            options: [],
            callback: (event) => {
                instance.sendCommand({ action: 'toggleMessage' });
            },
        },
        hide_message: {
            name: 'Clear Live Message',
            description: 'Remove the message from the screen while keeping its draft text',
            options: [],
            callback: () => instance.sendCommand({ action: 'clearMessage' }),
        },
        set_message: {
            name: 'Set Live Message',
            description: 'Set message text. If a message is already live, the screen updates immediately.',
            options: [
                {
                    id: 'message',
                    type: 'textinput',
                    label: 'Message text',
                    default: 'Your message here',
                    useVariables: true,
                    multiline: true,
                },
                {
                    id: 'send',
                    type: 'checkbox',
                    label: 'Send to screen immediately',
                    default: false,
                },
            ],
            callback: async (event, context) => {
                if (typeof event.options.message !== 'string') {
                    instance.log('warn', 'Enter message text before setting the live message');
                    return;
                }
                const message = await context.parseVariablesInString(event.options.message);
                instance.sendCommand({ action: 'setMessage', message, send: event.options.send === true });
            },
        },
        recall_timer_preset_a: {
            name: 'Recall Preset to Timer A',
            description: 'Apply one of your timer presets to Timer A',
            options: [
                {
                    id: 'presetId',
                    type: 'dropdown',
                    label: 'Preset',
                    default: (_b = (_a = timerPresetChoices[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '',
                    choices: timerPresetChoices,
                },
            ],
            callback: (event) => {
                recallPreset(event.options.presetId, 'A');
            },
        },
        recall_timer_preset_b: {
            name: 'Recall Preset to Timer B',
            description: 'Apply one of your timer presets to Timer B',
            options: [
                {
                    id: 'presetId',
                    type: 'dropdown',
                    label: 'Preset',
                    default: (_d = (_c = timerPresetChoices[0]) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : '',
                    choices: timerPresetChoices,
                },
            ],
            callback: (event) => {
                recallPreset(event.options.presetId, 'B');
            },
        },
        recall_message_preset: {
            name: 'Recall Message Preset',
            description: 'Load one of your message presets into the message field',
            options: [
                {
                    id: 'presetId',
                    type: 'dropdown',
                    label: 'Message preset',
                    default: (_f = (_e = messagePresetChoices[0]) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : '',
                    choices: messagePresetChoices,
                },
            ],
            callback: (event) => {
                recallPreset(event.options.presetId);
            },
        },
        set_layout: {
            name: 'Set Output Layout',
            description: 'Choose the output layout; this does not change a timer’s Countdown or Count Up type',
            options: [
                {
                    id: 'layout',
                    type: 'dropdown',
                    label: 'Output Layout',
                    default: 'Single Timer',
                    choices: timerModes_1.TIMER_MODE_CHOICES,
                },
            ],
            callback: (event) => {
                const layout = (0, timerModes_1.normalizeTimerMode)(event.options.layout);
                if (!timerModes_1.TIMER_MODE_CHOICES.some(choice => choice.id === layout)) {
                    instance.log('warn', 'Choose a valid timer layout');
                    return;
                }
                instance.sendCommand({ action: 'setLayout', layout });
            },
        },
        select_next_timer_preset: {
            name: 'Highlight Next Timer Preset',
            description: 'Scroll the highlighted timer preset (for a rotary)',
            options: [],
            callback: () => {
                instance.moveTimerPresetHighlight(1);
            },
        },
        select_previous_timer_preset: {
            name: 'Highlight Previous Timer Preset',
            description: 'Scroll the highlighted timer preset (for a rotary)',
            options: [],
            callback: () => {
                instance.moveTimerPresetHighlight(-1);
            },
        },
        recall_highlighted_timer_preset: {
            name: 'Load Highlighted Timer Preset',
            description: 'Load the highlighted preset into a timer (press the rotary)',
            options: [
                {
                    id: 'timer',
                    type: 'dropdown',
                    label: 'Timer',
                    default: 'A',
                    choices: [
                        { id: 'A', label: 'Timer A' },
                        { id: 'B', label: 'Timer B' },
                    ],
                },
            ],
            callback: (event) => {
                const preset = instance.highlightedTimerPresetInfo();
                if (!preset)
                    return;
                const timer = String(event.options.timer) === 'B' ? 'B' : 'A';
                instance.sendCommand({ action: 'recallTimerPreset', timer, presetId: preset.id });
            },
        },
        select_next_message_preset: {
            name: 'Highlight Next Message Preset',
            description: 'Scroll the highlighted message preset (for a rotary)',
            options: [],
            callback: () => {
                instance.moveMessagePresetHighlight(1);
            },
        },
        select_previous_message_preset: {
            name: 'Highlight Previous Message Preset',
            description: 'Scroll the highlighted message preset (for a rotary)',
            options: [],
            callback: () => {
                instance.moveMessagePresetHighlight(-1);
            },
        },
        recall_highlighted_message_preset: {
            name: 'Load Highlighted Message Preset',
            description: 'Load the highlighted message preset (press the rotary)',
            options: [],
            callback: () => {
                const preset = instance.highlightedMessagePresetInfo();
                if (!preset)
                    return;
                instance.sendCommand({ action: 'recallMessagePreset', presetId: preset.id });
            },
        },
        request_status: {
            name: 'Request Status Update',
            description: 'Request current status from the app',
            options: [],
            callback: (event) => {
                instance.requestStatus();
            },
        },
    };
}
exports.GetActionsList = GetActionsList;
//# sourceMappingURL=actions.js.map