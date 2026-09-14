"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeedbacksList = void 0;
const base_1 = require("@companion-module/base");
const timerModes_1 = require("./timerModes");
function GetFeedbacksList(instance) {
    return {
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
            name: 'Timer Visible',
            description: 'Changes style when the timer is showing on the output',
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
            name: 'Timer Mode Selected',
            description: 'Changes style while the app is in the chosen timer mode',
            defaultStyle: {
                bgcolor: (0, base_1.combineRgb)(0, 122, 255),
                color: (0, base_1.combineRgb)(255, 255, 255),
            },
            options: [
                {
                    id: 'layout',
                    type: 'dropdown',
                    label: 'Timer Mode',
                    default: 'Single Timer',
                    choices: timerModes_1.TIMER_MODE_CHOICES,
                },
            ],
            callback: (feedback) => {
                const status = instance.getAppStatus();
                return (status === null || status === void 0 ? void 0 : status.layout) === (0, timerModes_1.normalizeTimerMode)(feedback.options.layout);
            },
        },
    };
}
exports.GetFeedbacksList = GetFeedbacksList;
//# sourceMappingURL=feedbacks.js.map