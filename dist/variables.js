"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetVariableValues = exports.GetVariableDefinitions = void 0;
function GetVariableDefinitions() {
    return [
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
            name: 'Timer A Current Time (MM:SS)',
        },
        {
            variableId: 'timer_a_remaining_time',
            name: 'Timer A Remaining Time (seconds)',
        },
        {
            variableId: 'timer_a_remaining_time_formatted',
            name: 'Timer A Remaining Time (MM:SS)',
        },
        {
            variableId: 'timer_a_duration',
            name: 'Timer A Duration (seconds)',
        },
        {
            variableId: 'timer_a_duration_formatted',
            name: 'Timer A Duration (MM:SS)',
        },
        {
            variableId: 'timer_a_label',
            name: 'Timer A Label',
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
            name: 'Timer B Current Time (MM:SS)',
        },
        {
            variableId: 'timer_b_remaining_time',
            name: 'Timer B Remaining Time (seconds)',
        },
        {
            variableId: 'timer_b_remaining_time_formatted',
            name: 'Timer B Remaining Time (MM:SS)',
        },
        {
            variableId: 'timer_b_duration',
            name: 'Timer B Duration (seconds)',
        },
        {
            variableId: 'timer_b_duration_formatted',
            name: 'Timer B Duration (MM:SS)',
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
            name: 'Current Live Message Text',
        },
        {
            variableId: 'timer_mode',
            name: 'Timer Mode',
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
function GetVariableValues(status) {
    var _a, _b, _c, _d;
    const timerARemaining = status.timerA.duration - status.timerA.currentTime;
    const timerBRemaining = status.timerB.duration - status.timerB.currentTime;
    return {
        timer_a_state: status.timerA.state,
        timer_a_current_time: status.timerA.currentTime,
        timer_a_current_time_formatted: formatTime(status.timerA.currentTime),
        timer_a_remaining_time: timerARemaining,
        // Prefer the app's own text so overtime shows "+1:30" exactly as it
        // does on screen, rather than a negative remaining time.
        timer_a_remaining_time_formatted: (_a = status.timerA.displayText) !== null && _a !== void 0 ? _a : formatTime(timerARemaining),
        timer_a_duration: status.timerA.duration,
        timer_a_duration_formatted: formatTime(status.timerA.duration),
        timer_a_label: status.timerA.label,
        timer_b_state: status.timerB.state,
        timer_b_current_time: status.timerB.currentTime,
        timer_b_current_time_formatted: formatTime(status.timerB.currentTime),
        timer_b_remaining_time: timerBRemaining,
        timer_b_remaining_time_formatted: (_b = status.timerB.displayText) !== null && _b !== void 0 ? _b : formatTime(timerBRemaining),
        timer_b_duration: status.timerB.duration,
        timer_b_duration_formatted: formatTime(status.timerB.duration),
        timer_b_label: status.timerB.label,
        display_shown: status.displayShown.toString(),
        timer_visible: ((_c = status.timerVisible) !== null && _c !== void 0 ? _c : true).toString(),
        message_is_live: status.messageIsLive.toString(),
        live_message: status.liveMessage,
        timer_mode: (_d = status.layout) !== null && _d !== void 0 ? _d : '',
    };
}
exports.GetVariableValues = GetVariableValues;
//# sourceMappingURL=variables.js.map