"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTimerMode = exports.TIMER_MODE_CHOICES = void 0;
/** The app's timer modes, identified by the names it uses over the network. */
exports.TIMER_MODE_CHOICES = [
    { id: 'Single Timer', label: 'Single Timer' },
    { id: 'Dual Timers', label: 'Dual Timers' },
    { id: 'Clock Only', label: 'Clock Only' },
    { id: 'Clock + Timer', label: 'Clock and Timer' },
];
/**
 * Buttons made before 1.4.0 saved "Clock and Timer", a name the app didn't
 * recognise. Map it so those buttons work without being rebuilt.
 */
function normalizeTimerMode(value) {
    const mode = String(value);
    return mode === 'Clock and Timer' ? 'Clock + Timer' : mode;
}
exports.normalizeTimerMode = normalizeTimerMode;
//# sourceMappingURL=timerModes.js.map