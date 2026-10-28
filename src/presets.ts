import { CompanionPresetDefinitions, combineRgb } from '@companion-module/base'
import { AdvancedSpeakerTimerInstance } from './index'
import { TIMER_MODE_CHOICES } from './timerModes'
import { formatTime } from './variables'

const BLACK = combineRgb(0, 0, 0)
const WHITE = combineRgb(255, 255, 255)
const DARK = combineRgb(20, 20, 20)
const GREEN = combineRgb(0, 220, 80)
const AMBER = combineRgb(255, 165, 0)
const YELLOW = combineRgb(255, 220, 0)
const RED = combineRgb(255, 40, 40)
const BLUE = combineRgb(0, 90, 200)

/**
 * Ready-made buttons. Companion copies these onto a button when dragged, so
 * they're a starting point the user can edit — not a live link back here.
 */
export function GetPresetList(instance: AdvancedSpeakerTimerInstance): CompanionPresetDefinitions {
    const presets: CompanionPresetDefinitions = {}

    for (const timer of ['A', 'B'] as const) {
        const lower = timer.toLowerCase()
        const category = `Timer ${timer}`

        // Use the app's display text for countdown, count-up and target-time timers.
        presets[`timer_${lower}_countdown`] = {
            type: 'button',
            category,
            name: `Timer ${timer} live display (status colours)`,
            style: {
                text: `Timer ${timer}\n$(${instance.label}:timer_${lower}_display_text)`,
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
                    feedbackId: `timer_${lower}_paused`,
                    options: {},
                    style: { color: YELLOW },
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
                {
                    feedbackId: 'timer_state',
                    options: { timer, state: 'finished' },
                    style: { color: RED },
                },
            ],
        }

        presets[`timer_${lower}_elapsed`] = {
            type: 'button',
            category: 'Timer status',
            name: `Timer ${timer} elapsed time`,
            style: {
                text: `Elapsed ${timer}\n$(${instance.label}:timer_${lower}_current_time_formatted)`,
                size: '14',
                color: WHITE,
                bgcolor: DARK,
            },
            steps: [{ down: [], up: [] }],
            feedbacks: [],
        }

        presets[`timer_${lower}_start_pause`] = {
            type: 'button',
            category,
            name: `Timer ${timer} start / pause`,
            style: { text: `Start/Pause\n${timer}`, size: '18', color: WHITE, bgcolor: DARK },
            steps: [
                {
                    down: [{ actionId: `toggle_timer_${lower}`, options: {} }],
                    up: [],
                },
            ],
            feedbacks: [
                {
                    feedbackId: `timer_${lower}_running`,
                    options: {},
                    style: { bgcolor: GREEN, color: BLACK },
                },
                {
                    feedbackId: `timer_${lower}_paused`,
                    options: {},
                    style: { bgcolor: YELLOW, color: BLACK },
                },
            ],
        }

        presets[`timer_${lower}_reset`] = {
            type: 'button',
            category,
            name: `Timer ${timer} reset`,
            style: { text: `Reset\n${timer}`, size: '18', color: WHITE, bgcolor: DARK },
            steps: [{ down: [{ actionId: `reset_timer_${lower}`, options: {} }], up: [] }],
            feedbacks: [
                {
                    feedbackId: 'timer_state',
                    options: { timer, state: 'ready' },
                    style: { bgcolor: BLUE, color: WHITE },
                },
            ],
        }

        presets[`timer_${lower}_add_1m`] = {
            type: 'button',
            category,
            name: `Timer ${timer} +1 min`,
            style: { text: `+1m\n${timer}`, size: '18', color: WHITE, bgcolor: DARK },
            steps: [{ down: [{ actionId: `add_1m_timer_${lower}`, options: {} }], up: [] }],
            feedbacks: [],
        }

        presets[`timer_${lower}_sub_1m`] = {
            type: 'button',
            category,
            name: `Timer ${timer} -1 min`,
            style: { text: `-1m\n${timer}`, size: '18', color: WHITE, bgcolor: DARK },
            steps: [{ down: [{ actionId: `sub_1m_timer_${lower}`, options: {} }], up: [] }],
            feedbacks: [],
        }
    }

    // Output layouts are distinct from each timer's countdown/count-up mode.
    for (const mode of TIMER_MODE_CHOICES) {
        const key = String(mode.id).toLowerCase().replace(/[^a-z]+/g, '_')
        presets[`timer_mode_${key}`] = {
            type: 'button',
            category: 'Output layouts',
            name: `Output layout: ${mode.label}`,
            style: { text: mode.label, size: '14', color: WHITE, bgcolor: DARK },
            steps: [{ down: [{ actionId: 'set_layout', options: { layout: mode.id } }], up: [] }],
            feedbacks: [
                {
                    feedbackId: 'timer_mode',
                    options: { layout: mode.id },
                    style: { bgcolor: BLUE, color: WHITE },
                },
            ],
        }
    }

    // Rotary knobs (Stream Deck +): turn to scroll presets, press to load.
    for (const timer of ['A', 'B'] as const) {
        presets[`timer_preset_knob_${timer.toLowerCase()}`] = {
            type: 'button',
            category: 'Rotary controls',
            name: `Knob: browse timer presets, press to load Timer ${timer}`,
            options: { rotaryActions: true },
            style: {
                text: `$(${instance.label}:selected_timer_preset)\n$(${instance.label}:selected_timer_preset_number) → ${timer}`,
                size: '14',
                color: WHITE,
                bgcolor: DARK,
            },
            steps: [
                {
                    down: [{ actionId: 'recall_highlighted_timer_preset', options: { timer } }],
                    up: [],
                    rotate_left: [{ actionId: 'select_previous_timer_preset', options: {} }],
                    rotate_right: [{ actionId: 'select_next_timer_preset', options: {} }],
                },
            ],
            feedbacks: [],
        }
    }

    presets['message_preset_knob'] = {
        type: 'button',
        category: 'Rotary controls',
        name: 'Knob: browse message presets, press to load draft',
        options: { rotaryActions: true },
        style: {
            text: `$(${instance.label}:selected_message_preset)\n$(${instance.label}:selected_message_preset_number)`,
            size: '14',
            color: WHITE,
            bgcolor: DARK,
        },
        steps: [
            {
                down: [{ actionId: 'recall_highlighted_message_preset', options: {} }],
                up: [],
                rotate_left: [{ actionId: 'select_previous_message_preset', options: {} }],
                rotate_right: [{ actionId: 'select_next_message_preset', options: {} }],
            },
        ],
        feedbacks: [],
    }

    // Output control
    presets['toggle_output'] = {
        type: 'button',
        category: 'Output',
        name: 'Enable / disable external display window',
        style: { text: 'Output', size: '14', color: WHITE, bgcolor: DARK },
        steps: [{ down: [{ actionId: 'toggle_display', options: {} }], up: [] }],
        feedbacks: [
            { feedbackId: 'display_visible', options: {}, style: { bgcolor: BLUE, color: WHITE } },
        ],
    }

    presets['toggle_timer_visible'] = {
        type: 'button',
        category: 'Output',
        name: 'Show / hide timer overlay (keep background)',
        style: { text: 'Timer\nLayer', size: '14', color: WHITE, bgcolor: DARK },
        steps: [{ down: [{ actionId: 'toggle_timer_visible', options: {} }], up: [] }],
        feedbacks: [
            { feedbackId: 'timer_visible', options: {}, style: { bgcolor: GREEN, color: WHITE } },
        ],
    }

    presets['toggle_message'] = {
        type: 'button',
        category: 'More message controls',
        name: 'Send draft / hide live message',
        style: { text: 'Send/Hide\nMsg', size: '14', color: WHITE, bgcolor: DARK },
        steps: [{ down: [{ actionId: 'toggle_message', options: {} }], up: [] }],
        feedbacks: [
            { feedbackId: 'message_live', options: {}, style: { bgcolor: combineRgb(200, 0, 0), color: WHITE } },
        ],
    }

    // Explicit send also replaces a message that is already live.
    presets['send_message'] = {
        type: 'button',
        category: 'Messages',
        name: 'Send draft / replace live message',
        style: { text: 'Send\nDraft', size: '18', color: WHITE, bgcolor: DARK },
        steps: [{ down: [{ actionId: 'send_message', options: {} }], up: [] }],
        feedbacks: [
            { feedbackId: 'message_live', options: {}, style: { bgcolor: combineRgb(200, 0, 0), color: WHITE } },
        ],
    }

    // Deterministic clear for cue stacks: pressing this never sends a draft.
    presets['hide_message'] = {
        type: 'button',
        category: 'Messages',
        name: 'Clear live message (keep draft)',
        style: { text: 'Clear\nMsg', size: '14', color: WHITE, bgcolor: DARK },
        steps: [{ down: [{ actionId: 'hide_message', options: {} }], up: [] }],
        feedbacks: [
            { feedbackId: 'message_live', options: {}, style: { bgcolor: combineRgb(200, 0, 0), color: WHITE } },
        ],
    }

    // One button per message preset the app actually has.
    for (const preset of instance.getMessagePresets()) {
        presets[`message_preset_${preset.id}`] = {
            type: 'button',
            category: 'Message presets',
            name: `Load draft: ${preset.name}`,
            style: { text: `Draft\n${preset.name}`, size: '14', color: WHITE, bgcolor: DARK },
            steps: [
                {
                    down: [{ actionId: 'recall_message_preset', options: { presetId: preset.id } }],
                    up: [],
                },
            ],
            feedbacks: [],
        }
    }

    // One button per timer preset, for each timer.
    for (const preset of instance.getTimerPresets()) {
        for (const timer of ['A', 'B'] as const) {
            const lower = timer.toLowerCase()
            const duration = typeof preset.duration === 'number' && Number.isFinite(preset.duration)
                ? formatTime(preset.duration) : ''
            presets[`timer_preset_${lower}_${preset.id}`] = {
                type: 'button',
                category: `Timer ${timer} presets`,
                name: `Load "${preset.name}"${duration ? ` (${duration})` : ''} into Timer ${timer}`,
                style: {
                    text: `${preset.name}\n${duration ? `${duration} ` : ''}→ ${timer}`,
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
            }
        }
    }

    for (const preset of Object.values(presets)) {
        if (preset?.type !== 'button') continue
        preset.feedbacks.push({
            feedbackId: 'connection_unavailable',
            options: {},
            style: { bgcolor: combineRgb(80, 80, 80), color: WHITE },
        })
    }
    return presets
}
