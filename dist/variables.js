"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUnavailableVariableValues = exports.GetVariableValues = exports.formatTime = exports.GetVariableDefinitions = void 0;
function GetVariableDefinitions() {
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
    ];
}
exports.GetVariableDefinitions = GetVariableDefinitions;
/** Matches the app: H:MM:SS past an hour, otherwise M:SS. */
function formatTime(seconds) {
    const sign = seconds < 0 ? '-' : '';
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    if (hours > 0) {
        return `${sign}${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${sign}${minutes}:${secs.toString().padStart(2, '0')}`;
}
exports.formatTime = formatTime;
/** Count Up has no countdown deadline. Older apps expose only elapsed/duration. */
function remainingTime(timer) {
    var _a;
    if (timer.mode === 'Count Up' || timer.remainingTime === null)
        return '';
    return (_a = timer.remainingTime) !== null && _a !== void 0 ? _a : timer.duration - timer.currentTime;
}
function displayText(timer) {
    if (timer.displayText !== undefined)
        return timer.displayText;
    return formatTime(timer.mode === 'Count Up' ? timer.currentTime : timer.duration - timer.currentTime);
}
function GetVariableValues(status) {
    var _a, _b, _c, _d, _e, _f;
    const timerARemaining = remainingTime(status.timerA);
    const timerBRemaining = remainingTime(status.timerB);
    const timerADisplay = displayText(status.timerA);
    const timerBDisplay = displayText(status.timerB);
    return {
        timer_a_display_text: timerADisplay,
        timer_a_mode: (_a = status.timerA.mode) !== null && _a !== void 0 ? _a : '',
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
        timer_b_mode: (_b = status.timerB.mode) !== null && _b !== void 0 ? _b : '',
        timer_b_state: status.timerB.state,
        timer_b_current_time: status.timerB.currentTime,
        timer_b_current_time_formatted: formatTime(status.timerB.currentTime),
        timer_b_remaining_time: timerBRemaining,
        timer_b_remaining_time_formatted: timerBDisplay,
        timer_b_duration: status.timerB.duration,
        timer_b_duration_formatted: formatTime(status.timerB.duration),
        timer_b_label: status.timerB.label,
        display_shown: status.displayShown.toString(),
        timer_visible: (_d = (_c = status.timerVisible) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : '',
        message_is_live: status.messageIsLive.toString(),
        live_message: status.liveMessage,
        displayed_message: status.messageIsLive ? ((_e = status.displayedMessage) !== null && _e !== void 0 ? _e : '') : '',
        timer_mode: (_f = status.layout) !== null && _f !== void 0 ? _f : '',
    };
}
exports.GetVariableValues = GetVariableValues;
/** Clear values that could otherwise look live after a lost connection. */
function GetUnavailableVariableValues() {
    const values = {};
    for (const definition of GetVariableDefinitions()) {
        if (!definition.variableId.startsWith('selected_') && definition.variableId !== 'connection_status') {
            values[definition.variableId] = '';
        }
    }
    for (const timer of ['a', 'b']) {
        values[`timer_${timer}_display_text`] = 'Unavailable';
        values[`timer_${timer}_state`] = 'unavailable';
        values[`timer_${timer}_current_time_formatted`] = 'Unavailable';
        values[`timer_${timer}_remaining_time_formatted`] = 'Unavailable';
        values[`timer_${timer}_duration_formatted`] = '—';
    }
    return values;
}
exports.GetUnavailableVariableValues = GetUnavailableVariableValues;
//# sourceMappingURL=variables.js.map