"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeedbacksList = void 0;
const base_1 = require("@companion-module/base");
const timerModes_1 = require("./timerModes");
function GetFeedbacksList(instance) {
    return {
        connection_unavailable: {
            type: 'boolean',
            name: 'Timer Connection Unavailable',
            description: 'Changes style while disconnected or without recent timer status',
            defaultStyle: { bgcolor: (0, base_1.combineRgb)(80, 80, 80), color: (0, base_1.combineRgb)(255, 255, 255) },
            options: [],
            callback: () => !instance.hasCurrentStatus(),
        },
        timer_a_running: {
            type: 'boolean',
            name: 'Timer A Running',
            description: 'Changes style when Timer A is running',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(0, 255, 0),
                color: (0, base_1.combineRgb)(0, 0, 0),
            },
            options: [],
            callback: (feedback) => {
                var _a;
                const status = instance.getAppStatus();
                return ((_a = status === null || status === void 0 ? void 0 : status.timerA) === null || _a === void 0 ? void 0 : _a.state) === 'running';
            },
        },
        timer_a_paused: {
            type: 'boolean',
            name: 'Timer A Paused',
            description: 'Changes style when Timer A is paused',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(255, 255, 0),
                color: (0, base_1.combineRgb)(0, 0, 0),
            },
            options: [],
            callback: (feedback) => {
                var _a;
                const status = instance.getAppStatus();
                return ((_a = status === null || status === void 0 ? void 0 : status.timerA) === null || _a === void 0 ? void 0 : _a.state) === 'paused';
            },
        },
        timer_a_warning: {
            type: 'boolean',
            name: 'Timer A in Warning Time',
            description: 'Changes style when Timer A is in warning period',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(255, 165, 0),
                color: (0, base_1.combineRgb)(0, 0, 0),
            },
            options: [],
            callback: (feedback) => {
                const status = instance.getAppStatus();
                const timer = status === null || status === void 0 ? void 0 : status.timerA;
                if (!timer)
                    return false;
                // The app reports this directly; fall back for older versions.
                if (typeof timer.isWarning === 'boolean')
                    return timer.isWarning;
                // Legacy apps lack isWarning; match the app's warning rules,
                // including its suppression while paused/ready or counting up.
                if (timer.state !== 'running' || timer.mode === 'Count Up')
                    return false;
                const timeLeft = timer.duration - timer.currentTime;
                return timeLeft <= timer.warningTime && timeLeft > 0;
            },
        },
        timer_a_overtime: {
            type: 'boolean',
            name: 'Timer A Overtime',
            description: 'Changes style when Timer A is in overtime',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(255, 0, 0),
                color: (0, base_1.combineRgb)(255, 255, 255),
            },
            options: [],
            callback: (feedback) => {
                const status = instance.getAppStatus();
                const timer = status === null || status === void 0 ? void 0 : status.timerA;
                if (!timer)
                    return false;
                // With a Count Up end behaviour the app keeps the state as
                // "running" past zero, so rely on its computed flag.
                if (typeof timer.isOvertime === 'boolean')
                    return timer.isOvertime;
                return timer.state === 'overtime';
            },
        },
        timer_b_running: {
            type: 'boolean',
            name: 'Timer B Running',
            description: 'Changes style when Timer B is running',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(0, 255, 0),
                color: (0, base_1.combineRgb)(0, 0, 0),
            },
            options: [],
            callback: (feedback) => {
                var _a;
                const status = instance.getAppStatus();
                return ((_a = status === null || status === void 0 ? void 0 : status.timerB) === null || _a === void 0 ? void 0 : _a.state) === 'running';
            },
        },
        timer_b_paused: {
            type: 'boolean',
            name: 'Timer B Paused',
            description: 'Changes style when Timer B is paused',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(255, 255, 0),
                color: (0, base_1.combineRgb)(0, 0, 0),
            },
            options: [],
            callback: (feedback) => {
                var _a;
                const status = instance.getAppStatus();
                return ((_a = status === null || status === void 0 ? void 0 : status.timerB) === null || _a === void 0 ? void 0 : _a.state) === 'paused';
            },
        },
        timer_b_warning: {
            type: 'boolean',
            name: 'Timer B in Warning Time',
            description: 'Changes style when Timer B is in warning period',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(255, 165, 0),
                color: (0, base_1.combineRgb)(0, 0, 0),
            },
            options: [],
            callback: (feedback) => {
                const status = instance.getAppStatus();
                const timer = status === null || status === void 0 ? void 0 : status.timerB;
                if (!timer)
                    return false;
                // The app reports this directly; fall back for older versions.
                if (typeof timer.isWarning === 'boolean')
                    return timer.isWarning;
                // Legacy apps lack isWarning; match the app's warning rules,
                // including its suppression while paused/ready or counting up.
                if (timer.state !== 'running' || timer.mode === 'Count Up')
                    return false;
                const timeLeft = timer.duration - timer.currentTime;
                return timeLeft <= timer.warningTime && timeLeft > 0;
            },
        },
        timer_b_overtime: {
            type: 'boolean',
            name: 'Timer B Overtime',
            description: 'Changes style when Timer B is in overtime',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(255, 0, 0),
                color: (0, base_1.combineRgb)(255, 255, 255),
            },
            options: [],
            callback: (feedback) => {
                const status = instance.getAppStatus();
                const timer = status === null || status === void 0 ? void 0 : status.timerB;
                if (!timer)
                    return false;
                // With a Count Up end behaviour the app keeps the state as
                // "running" past zero, so rely on its computed flag.
                if (typeof timer.isOvertime === 'boolean')
                    return timer.isOvertime;
                return timer.state === 'overtime';
            },
        },
        timer_state: {
            type: 'boolean',
            name: 'Timer State',
            description: 'Changes style when the selected timer is ready, running, paused, finished, or stopped with overtime text',
            defaultStyle: { bgcolor: (0, base_1.combineRgb)(0, 122, 255), color: (0, base_1.combineRgb)(255, 255, 255) },
            options: [
                {
                    id: 'timer', type: 'dropdown', label: 'Timer', default: 'A',
                    choices: [{ id: 'A', label: 'Timer A' }, { id: 'B', label: 'Timer B' }],
                },
                {
                    id: 'state', type: 'dropdown', label: 'State', default: 'ready',
                    choices: [
                        { id: 'ready', label: 'Ready / Reset' },
                        { id: 'running', label: 'Running (including counting overtime)' },
                        { id: 'paused', label: 'Paused' },
                        { id: 'finished', label: 'Finished' },
                        { id: 'overtime', label: 'Stopped with overtime text' },
                    ],
                },
            ],
            callback: (feedback) => {
                const status = instance.getAppStatus();
                const timer = feedback.options.timer === 'A' ? status === null || status === void 0 ? void 0 : status.timerA
                    : feedback.options.timer === 'B' ? status === null || status === void 0 ? void 0 : status.timerB : undefined;
                return timer !== undefined && timer.state === feedback.options.state;
            },
        },
        display_visible: {
            type: 'boolean',
            name: 'Output Enabled',
            description: 'Changes style when the output window is up',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(0, 0, 255),
                color: (0, base_1.combineRgb)(255, 255, 255),
            },
            options: [],
            callback: (feedback) => {
                const status = instance.getAppStatus();
                return (status === null || status === void 0 ? void 0 : status.displayShown) === true;
            },
        },
        timer_visible: {
            type: 'boolean',
            name: 'Timer Display Enabled',
            description: 'Changes style when timer visibility is enabled, independently of the output window',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(0, 128, 255),
                color: (0, base_1.combineRgb)(255, 255, 255),
            },
            options: [],
            callback: (feedback) => {
                const status = instance.getAppStatus();
                return (status === null || status === void 0 ? void 0 : status.timerVisible) === true;
            },
        },
        message_live: {
            type: 'boolean',
            name: 'Live Message Active',
            description: 'Changes style when a live message is active',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(255, 0, 0),
                color: (0, base_1.combineRgb)(255, 255, 255),
            },
            options: [],
            callback: (feedback) => {
                const status = instance.getAppStatus();
                return (status === null || status === void 0 ? void 0 : status.messageIsLive) === true;
            },
        },
        timer_mode: {
            type: 'boolean',
            name: 'Output Layout Selected',
            description: 'Changes style while the app uses the chosen output layout',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(0, 122, 255),
                color: (0, base_1.combineRgb)(255, 255, 255),
            },
            options: [
                {
                    id: 'layout',
                    type: 'dropdown',
                    label: 'Output Layout',
                    default: 'Single Timer',
                    choices: timerModes_1.TIMER_MODE_CHOICES,
                },
            ],
            callback: (feedback) => {
                const status = instance.getAppStatus();
                return (status === null || status === void 0 ? void 0 : status.layout) !== undefined && (0, timerModes_1.normalizeTimerMode)(status.layout) === (0, timerModes_1.normalizeTimerMode)(feedback.options.layout);
            },
        },
    };
}
exports.GetFeedbacksList = GetFeedbacksList;
//# sourceMappingURL=feedbacks.js.map