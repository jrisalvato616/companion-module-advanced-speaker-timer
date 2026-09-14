import { DropdownChoice } from '@companion-module/base'

/** The app's timer modes, identified by the names it uses over the network. */
export const TIMER_MODE_CHOICES: DropdownChoice[] = [
    { id: 'Single Timer', label: 'Single Timer' },
    { id: 'Dual Timers', label: 'Dual Timers' },
    { id: 'Clock Only', label: 'Clock Only' },
    { id: 'Clock + Timer', label: 'Clock and Timer' },
]

/**
 * Buttons made before 1.4.0 saved "Clock and Timer", a name the app didn't
 * recognise. Map it so those buttons work without being rebuilt.
 */
export function normalizeTimerMode(value: unknown): string {
    const mode = String(value)
    return mode === 'Clock and Timer' ? 'Clock + Timer' : mode
}
