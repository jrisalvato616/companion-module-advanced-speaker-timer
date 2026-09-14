"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPresetList = void 0;
const base_1 = require("@companion-module/base");
const timerModes_1 = require("./timerModes");
const BLACK = (0, base_1.combineRgb)(0, 0, 0);
const WHITE = (0, base_1.combineRgb)(255, 255, 255);
const DARK = (0, base_1.combineRgb)(20, 20, 20);
const GREEN = (0, base_1.combineRgb)(0, 220, 80);
const AMBER = (0, base_1.combineRgb)(255, 165, 0);
const RED = (0, base_1.combineRgb)(255, 40, 40);
const BLUE = (0, base_1.combineRgb)(0, 90, 200);
/**
 * Ready-made buttons. Companion copies these onto a button when dragged, so
 * they're a starting point the user can edit — not a live link back here.
 */
function GetPresetList(instance) {
    const presets = {};
    for (const timer of ['A', 'B']) {
        const lower = timer.toLowerCase();
        const category = `Timer ${timer}`;
        // The headline feature: a live countdown that recolours itself.
        presets[`timer_${lower}_countdown`] = {
            type: 'button',
            category,
            name: `Timer ${timer} countdown (colours on warning/overtime)`,
            style: {
                text: `Timer ${timer}\n$(${instance.label}:timer_${lower}_remaining_time_formatted)`,
                size: '14',
                // White while reset/idle; the feedbacks below recolour only the
                // text, leaving the button background black.
                color: WHITE,
                bgcolor: BLACK,
            },
            steps: [{ down: [], up: [] }],
            feedbacks: [
                {
                    feedbackId: `timer_${lower}_running`,
                    options: {},
                    style: { color: GREEN },
                },
                {
                    feedbackId: `timer_${lower}_warning`,
                    options: {},
                    style: { color: AMBER },
                },
                {
                    feedbackId: `timer_${lower}_overtime`,
                    options: {},
                    style: { color: RED },
                },
            ],
        };
        presets[`timer_${lower}_elapsed`] = {
            type: 'button',
            category,
            name: `Timer ${timer} elapsed time`,
            style: {
                text: `Elapsed\n$(${instance.label}:timer_${lower}_current_time_formatted)`,
                size: '14',
                color: WHITE,
                bgcolor: DARK,
            },
            steps: [{ down: [], up: [] }],
            feedbacks: [],
        };
        presets[`timer_${lower}_start_pause`] = {
            type: 'button',
            category,
            name: `Timer ${timer} start / pause`,
            style: { text: `Start\n${timer}`, size: '18', color: WHITE, bgcolor: DARK },
            steps: [
                {
                    down: [{ actionId: `start_timer_${lower}`, options: {} }],
                    up: [],
                },
                {
                    down: [{ actionId: `pause_timer_${lower}`, options: {} }],
                    up: [],
                },
            ],
            feedbacks: [
                {
                    feedbackId: `timer_${lower}_running`,
                    options: {},
                    style: { bgcolor: GREEN, color: WHITE },
                },
            ],
        };
        presets[`timer_${lower}_reset`] = {
            type: 'button',
            category,
            name: `Timer ${timer} reset`,
            style: { text: `Reset\n${timer}`, size: '18', color: WHITE, bgcolor: DARK },
            steps: [{ down: [{ actionId: `reset_timer_${lower}`, options: {} }], up: [] }],
            feedbacks: [],
        };
        presets[`timer_${lower}_add_1m`] = {
            type: 'button',
            category,
            name: `Timer ${timer} +1 min`,
            style: { text: `+1m\n${timer}`, size: '18', color: WHITE, bgcolor: DARK },
            steps: [{ down: [{ actionId: `add_1m_timer_${lower}`, options: {} }], up: [] }],
            feedbacks: [],
        };
        presets[`timer_${lower}_sub_1m`] = {
            type: 'button',
            category,
            name: `Timer ${timer} -1 min`,
            style: { text: `-1m\n${timer}`, size: '18', color: WHITE, bgcolor: DARK },
            steps: [{ down: [{ actionId: `sub_1m_timer_${lower}`, options: {} }], up: [] }],
            feedbacks: [],
        };
    }
    // One button per timer mode, lit while that mode is selected.
    for (const mode of timerModes_1.TIMER_MODE_CHOICES) {
        const key = String(mode.id).toLowerCase().replace(/[^a-z]+/g, '_');
        presets[`timer_mode_${key}`] = {
            type: 'button',
            category: 'Timer Mode',
            name: `Timer mode: ${mode.label}`,
            style: { text: mode.label, size: '14', color: WHITE, bgcolor: DARK },
            steps: [{ down: [{ actionId: 'set_layout', options: { layout: mode.id } }], up: [] }],
            feedbacks: [
                {
                    feedbackId: 'timer_mode',
                    options: { layout: mode.id },
                    style: { bgcolor: BLUE, color: WHITE },
                },
            ],
        };
    }
    // Output control
    presets['toggle_output'] = {
        type: 'button',
        category: 'Output',
        name: 'Enable / disable output',
        style: { text: 'Output', size: '18', color: WHITE, bgcolor: DARK },
        steps: [{ down: [{ actionId: 'toggle_display', options: {} }], up: [] }],
        feedbacks: [
            { feedbackId: 'display_visible', options: {}, style: { bgcolor: BLUE, color: WHITE } },
        ],
    };
    presets['toggle_timer_visible'] = {
        type: 'button',
        category: 'Output',
        name: 'Show / hide timer (go to black)',
        style: { text: 'Show\nTimer', size: '18', color: WHITE, bgcolor: DARK },
        steps: [{ down: [{ actionId: 'toggle_timer_visible', options: {} }], up: [] }],
        feedbacks: [
            { feedbackId: 'timer_visible', options: {}, style: { bgcolor: GREEN, color: WHITE } },
        ],
    };
    presets['toggle_message'] = {
        type: 'button',
        category: 'Messages',
        name: 'Send / clear live message',
        style: { text: 'Message', size: '18', color: WHITE, bgcolor: DARK },
        steps: [{ down: [{ actionId: 'toggle_message', options: {} }], up: [] }],
        feedbacks: [
            { feedbackId: 'message_live', options: {}, style: { bgcolor: (0, base_1.combineRgb)(200, 0, 0), color: WHITE } },
        ],
    };
    // One button per message preset the app actually has.
    for (const preset of instance.getMessagePresets()) {
        presets[`message_preset_${preset.id}`] = {
            type: 'button',
            category: 'Messages',
            name: `Recall message: ${preset.name}`,
            style: { text: preset.name, size: '14', color: WHITE, bgcolor: DARK },
            steps: [
                {
                    down: [{ actionId: 'recall_message_preset', options: { presetId: preset.id } }],
                    up: [],
                },
            ],
            feedbacks: [],
        };
    }
    // One button per timer preset, for each timer.
    for (const preset of instance.getTimerPresets()) {
        for (const timer of ['A', 'B']) {
            const lower = timer.toLowerCase();
            presets[`timer_preset_${lower}_${preset.id}`] = {
                type: 'button',
                category: 'Timer presets',
                name: `Recall "${preset.name}" to Timer ${timer}`,
                style: {
                    text: `${preset.name}\n→ ${timer}`,
                    size: '14',
                    color: WHITE,
                    bgcolor: DARK,
                },
                steps: [
                    {
                        down: [
                            {
                                actionId: `recall_timer_preset_${lower}`,
                                options: { presetId: preset.id },
                            },
                        ],
                        up: [],
                    },
                ],
                feedbacks: [],
            };
        }
    }
    return presets;
}
exports.GetPresetList = GetPresetList;
//# sourceMappingURL=presets.js.map