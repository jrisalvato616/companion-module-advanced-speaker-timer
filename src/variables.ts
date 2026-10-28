import { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'

interface TimerStatus {
    state: string
    currentTime: number
    duration: number
    warningTime: number
    label: string
    /** Optional: older app versions don't report this. */
    displayText?: string
    mode?: string
    /** Signed countdown seconds from the app; null for a Count Up timer. */
    remainingTime?: number | null
}

interface AppStatus {
    timerA: TimerStatus
    timerB: TimerStatus
    displayShown: boolean
    /** Optional: older app versions don't report this. */
    timerVisible?: boolean
    messageIsLive: boolean
    liveMessage: string
    displayedMessage?: string
    /** Optional: older app versions don't report this. */
    layout?: string
}

export function GetVariableDefinitions(): CompanionVariableDefinition[] {
    return [
        {
            variableId: 'timer_a_display_text',
            name: 'Timer A Display Text (matches the app)',
        },
        {
            variableId: 'timer_a_mode',
            name: 'Timer A Type (Countdown / Count Up / Countdown to Time)',
        },
        {
            variableId: 'timer_a_state',
            name: 'Timer A State',
        },
        {
            variableId: 'timer_a_current_time',
            name: 'Timer A Current Time (seconds)',
        },
        {
            variableId: 'timer_a_current_time_formatted',
            name: 'Timer A Elapsed Time (M:SS or H:MM:SS)',
        },
        {
            variableId: 'timer_a_remaining_time',
            name: 'Timer A Remaining Time (seconds; blank for Count Up)',
        },
        {
            variableId: 'timer_a_remaining_time_formatted',
            name: 'Timer A Display Text (legacy remaining-time variable)',
        },
        {
            variableId: 'timer_a_duration',
            name: 'Timer A Duration (seconds)',
        },
        {
            variableId: 'timer_a_duration_formatted',
            name: 'Timer A Duration (M:SS or H:MM:SS)',
        },
        {
            variableId: 'timer_a_label',
            name: 'Timer A Label',
        },
        {
            variableId: 'timer_b_display_text',
            name: 'Timer B Display Text (matches the app)',
        },
        {
            variableId: 'timer_b_mode',
            name: 'Timer B Type (Countdown / Count Up / Countdown to Time)',
        },
        {
            variableId: 'timer_b_state',
            name: 'Timer B State',
        },
        {
            variableId: 'timer_b_current_time',
            name: 'Timer B Current Time (seconds)',
        },
        {
            variableId: 'timer_b_current_time_formatted',
            name: 'Timer B Elapsed Time (M:SS or H:MM:SS)',
        },
        {
            variableId: 'timer_b_remaining_time',
            name: 'Timer B Remaining Time (seconds; blank for Count Up)',
        },
        {
            variableId: 'timer_b_remaining_time_formatted',
            name: 'Timer B Display Text (legacy remaining-time variable)',
        },
        {
            variableId: 'timer_b_duration',
            name: 'Timer B Duration (seconds)',
        },
        {
            variableId: 'timer_b_duration_formatted',
            name: 'Timer B Duration (M:SS or H:MM:SS)',
        },
        {
            variableId: 'timer_b_label',
            name: 'Timer B Label',
        },
        {
            variableId: 'display_shown',
            name: 'Output Enabled (true/false)',
        },
        {
            variableId: 'timer_visible',
            name: 'Timer Visible (true/false)',
        },
        {
            variableId: 'message_is_live',
            name: 'Live Message Active (true/false)',
        },
        {
            variableId: 'live_message',
            name: 'Draft Message Text',
        },
        {
            variableId: 'displayed_message',
            name: 'On-screen Message Text (when reported by the app)',
        },
        {
            variableId: 'connection_status',
            name: 'Connection Status (connecting/waiting/connected/stale/disconnected)',
        },
        {
            variableId: 'timer_mode',
            name: 'Output Layout',
        },
        // For scrolling presets with a rotary: what's currently highlighted.
        {
            variableId: 'selected_timer_preset',
            name: 'Highlighted Timer Preset (name)',
        },
        {
            variableId: 'selected_timer_preset_duration',
            name: 'Highlighted Timer Preset (duration)',
        },
        {
            variableId: 'selected_timer_preset_number',
            name: 'Highlighted Timer Preset (e.g. 2/7)',
        },
        {
            variableId: 'selected_message_preset',
            name: 'Highlighted Message Preset (name)',
        },
        {
            variableId: 'selected_message_preset_number',
            name: 'Highlighted Message Preset (e.g. 2/5)',
        },
    ]
}

/** Matches the app: H:MM:SS past an hour, otherwise M:SS. */
export function formatTime(seconds: number): string {
    const sign = seconds < 0 ? '-' : ''
    const absSeconds = Math.abs(seconds)
    const hours = Math.floor(absSeconds / 3600)
    const minutes = Math.floor((absSeconds % 3600) / 60)
    const secs = absSeconds % 60

    if (hours > 0) {
        return `${sign}${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${sign}${minutes}:${secs.toString().padStart(2, '0')}`
}

/** Count Up has no countdown deadline. Older apps expose only elapsed/duration. */
function remainingTime(timer: TimerStatus): number | '' {
    if (timer.mode === 'Count Up' || timer.remainingTime === null) return ''
    return timer.remainingTime ?? timer.duration - timer.currentTime
}

function displayText(timer: TimerStatus): string {
    if (timer.displayText !== undefined) return timer.displayText
    return formatTime(timer.mode === 'Count Up' ? timer.currentTime : timer.duration - timer.currentTime)
}

export function GetVariableValues(status: AppStatus): CompanionVariableValues {
    const timerARemaining = remainingTime(status.timerA)
    const timerBRemaining = remainingTime(status.timerB)
    const timerADisplay = displayText(status.timerA)
    const timerBDisplay = displayText(status.timerB)

    return {
        timer_a_display_text: timerADisplay,
        timer_a_mode: status.timerA.mode ?? '',
        timer_a_state: status.timerA.state,
        timer_a_current_time: status.timerA.currentTime,
        timer_a_current_time_formatted: formatTime(status.timerA.currentTime),
        timer_a_remaining_time: timerARemaining,
        // Keep existing buttons working: this legacy variable has always
        // mirrored display text, including Count Up and signed overtime.
        timer_a_remaining_time_formatted: timerADisplay,
        timer_a_duration: status.timerA.duration,
        timer_a_duration_formatted: formatTime(status.timerA.duration),
        timer_a_label: status.timerA.label,

        timer_b_display_text: timerBDisplay,
        timer_b_mode: status.timerB.mode ?? '',
        timer_b_state: status.timerB.state,
        timer_b_current_time: status.timerB.currentTime,
        timer_b_current_time_formatted: formatTime(status.timerB.currentTime),
        timer_b_remaining_time: timerBRemaining,
        timer_b_remaining_time_formatted: timerBDisplay,
        timer_b_duration: status.timerB.duration,
        timer_b_duration_formatted: formatTime(status.timerB.duration),
        timer_b_label: status.timerB.label,

        display_shown: status.displayShown.toString(),
        timer_visible: status.timerVisible?.toString() ?? '',
        message_is_live: status.messageIsLive.toString(),
        live_message: status.liveMessage,
        displayed_message: status.messageIsLive ? (status.displayedMessage ?? '') : '',
        timer_mode: status.layout ?? '',
    }
}
/** Clear values that could otherwise look live after a lost connection. */
export function GetUnavailableVariableValues(): CompanionVariableValues {
    const values: CompanionVariableValues = {}
    for (const definition of GetVariableDefinitions()) {
        if (!definition.variableId.startsWith('selected_') && definition.variableId !== 'connection_status') {
            values[definition.variableId] = ''
        }
    }
    for (const timer of ['a', 'b']) {
        values[`timer_${timer}_display_text`] = 'Unavailable'
        values[`timer_${timer}_state`] = 'unavailable'
        values[`timer_${timer}_current_time_formatted`] = 'Unavailable'
        values[`timer_${timer}_remaining_time_formatted`] = 'Unavailable'
        values[`timer_${timer}_duration_formatted`] = '—'
    }
    return values
}
