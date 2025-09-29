import { SomeCompanionConfigField } from '@companion-module/base'

export interface SpeakerTimerConfig {
    host: string
    port: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
    return [
        {
            type: 'textinput',
            id: 'host',
            label: 'Advanced Speaker Timer Pro IP Address',
            width: 8,
            default: '127.0.0.1',
            regex: '/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/',
        },
        {
            type: 'number',
            id: 'port',
            label: 'TCP Port',
            width: 4,
            default: 18765,
            min: 1,
            max: 65535,
        },
        {
            type: 'static-text',
            id: 'info',
            width: 12,
            label: 'Information',
            value: 'This module connects to Advanced Speaker Timer Pro via TCP. Make sure the app is running and the TCP server is enabled.',
        },
    ]
}