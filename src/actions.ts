import { CompanionActionEvent, CompanionActionDefinitions } from '@companion-module/base'
import { AdvancedSpeakerTimerInstance } from './index'

export function GetActionsList(instance: AdvancedSpeakerTimerInstance): CompanionActionDefinitions {
    const timerPresetChoices = instance.getTimerPresets().map((p) => ({ id: p.id, label: p.name }))
    const messagePresetChoices = instance.getMessagePresets().map((p) => ({ id: p.id, label: p.name }))

    return {
        start_timer_a: {
            name: 'Start Timer A',
            description: 'Start Timer A',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'start', timer: 'A' })
            },
        },
        pause_timer_a: {
            name: 'Pause Timer A',
            description: 'Pause Timer A',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'pause', timer: 'A' })
            },
        },
        reset_timer_a: {
            name: 'Reset Timer A',
            description: 'Reset Timer A',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'reset', timer: 'A' })
            },
        },
        start_timer_b: {
            name: 'Start Timer B',
            description: 'Start Timer B',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'start', timer: 'B' })
            },
        },
        pause_timer_b: {
            name: 'Pause Timer B',
            description: 'Pause Timer B',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'pause', timer: 'B' })
            },
        },
        reset_timer_b: {
            name: 'Reset Timer B',
            description: 'Reset Timer B',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'reset', timer: 'B' })
            },
        },
        adjust_timer_a: {
            name: 'Adjust Timer A',
            description: 'Add or subtract time from Timer A',
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
            callback: (event: CompanionActionEvent) => {
                const seconds = Number(event.options.seconds)
                instance.sendCommand({ action: 'adjust', timer: 'A', value: seconds.toString() })
            },
        },
        adjust_timer_b: {
            name: 'Adjust Timer B',
            description: 'Add or subtract time from Timer B',
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
            callback: (event: CompanionActionEvent) => {
                const seconds = Number(event.options.seconds)
                instance.sendCommand({ action: 'adjust', timer: 'B', value: seconds.toString() })
            },
        },
        add_30s_timer_a: {
            name: 'Add 30s to Timer A',
            description: 'Add 30 seconds to Timer A',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'adjust', timer: 'A', value: '30' })
            },
        },
        add_1m_timer_a: {
            name: 'Add 1min to Timer A',
            description: 'Add 1 minute to Timer A',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'adjust', timer: 'A', value: '60' })
            },
        },
        sub_30s_timer_a: {
            name: 'Remove 30s from Timer A',
            description: 'Remove 30 seconds from Timer A',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'adjust', timer: 'A', value: '-30' })
            },
        },
        sub_1m_timer_a: {
            name: 'Remove 1min from Timer A',
            description: 'Remove 1 minute from Timer A',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'adjust', timer: 'A', value: '-60' })
            },
        },
        add_30s_timer_b: {
            name: 'Add 30s to Timer B',
            description: 'Add 30 seconds to Timer B',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'adjust', timer: 'B', value: '30' })
            },
        },
        add_1m_timer_b: {
            name: 'Add 1min to Timer B',
            description: 'Add 1 minute to Timer B',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'adjust', timer: 'B', value: '60' })
            },
        },
        sub_30s_timer_b: {
            name: 'Remove 30s from Timer B',
            description: 'Remove 30 seconds from Timer B',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'adjust', timer: 'B', value: '-30' })
            },
        },
        sub_1m_timer_b: {
            name: 'Remove 1min from Timer B',
            description: 'Remove 1 minute from Timer B',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'adjust', timer: 'B', value: '-60' })
            },
        },
        show_display: {
            name: 'Enable Output',
            description: 'Put the output window up on the external display',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'showDisplay' })
            },
        },
        hide_display: {
            name: 'Disable Output',
            description: 'Take the output window down and release the display',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'hideDisplay' })
            },
        },
        toggle_display: {
            name: 'Toggle Output',
            description: 'Toggle the output window on the external display',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'toggleDisplay' })
            },
        },
        show_timer: {
            name: 'Show Timer',
            description: 'Show the timer over the background',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'showTimer' })
            },
        },
        hide_timer: {
            name: 'Hide Timer',
            description: 'Hide the timer, leaving the background on screen',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'hideTimer' })
            },
        },
        toggle_timer_visible: {
            name: 'Toggle Timer',
            description: 'Show or hide the timer without taking the output down',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'toggleTimerVisible' })
            },
        },
        toggle_message: {
            name: 'Toggle Live Message',
            description: 'Toggle the live message display',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.sendCommand({ action: 'toggleMessage' })
            },
        },
        set_message: {
            name: 'Set Live Message',
            description: 'Set the live message text',
            options: [
                {
                    id: 'message',
                    type: 'textinput',
                    label: 'Message text',
                    default: 'Your message here',
                },
                {
                    id: 'send',
                    type: 'checkbox',
                    label: 'Send to screen immediately',
                    default: false,
                },
            ],
            callback: (event: CompanionActionEvent) => {
                const message = String(event.options.message)
                const send = Boolean(event.options.send)
                instance.sendCommand({ action: 'setMessage', message, send })
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
                    default: timerPresetChoices[0]?.id ?? '',
                    choices: timerPresetChoices,
                },
            ],
            callback: (event: CompanionActionEvent) => {
                const presetId = String(event.options.presetId)
                instance.sendCommand({ action: 'recallTimerPreset', timer: 'A', presetId })
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
                    default: timerPresetChoices[0]?.id ?? '',
                    choices: timerPresetChoices,
                },
            ],
            callback: (event: CompanionActionEvent) => {
                const presetId = String(event.options.presetId)
                instance.sendCommand({ action: 'recallTimerPreset', timer: 'B', presetId })
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
                    default: messagePresetChoices[0]?.id ?? '',
                    choices: messagePresetChoices,
                },
            ],
            callback: (event: CompanionActionEvent) => {
                const presetId = String(event.options.presetId)
                instance.sendCommand({ action: 'recallMessagePreset', presetId })
            },
        },
        set_layout: {
            name: 'Set Layout',
            description: 'Switch the display layout',
            options: [
                {
                    id: 'layout',
                    type: 'dropdown',
                    label: 'Layout',
                    default: 'Single Timer',
                    choices: [
                        { id: 'Single Timer', label: 'Single Timer' },
                        { id: 'Dual Timers', label: 'Dual Timers' },
                        { id: 'Clock Only', label: 'Clock Only' },
                        { id: 'Clock and Timer', label: 'Clock and Timer' },
                    ],
                },
            ],
            callback: (event: CompanionActionEvent) => {
                const layout = String(event.options.layout)
                instance.sendCommand({ action: 'setLayout', layout })
            },
        },
        request_status: {
            name: 'Request Status Update',
            description: 'Request current status from the app',
            options: [],
            callback: (event: CompanionActionEvent) => {
                instance.requestStatus()
            },
        },
    }
}