import { CompanionFeedbackDefinitions, CompanionFeedbackInfo, combineRgb } from '@companion-module/base'
import { AdvancedSpeakerTimerInstance } from './index'

export function GetFeedbacksList(instance: AdvancedSpeakerTimerInstance): CompanionFeedbackDefinitions {
    return {
        timer_a_running: {
            type: 'boolean',
            name: 'Timer A Running',
            description: 'Changes style when Timer A is running',
            defaultStyle: {
                bgcolor: combineRgb(0, 255, 0),
                color: combineRgb(0, 0, 0),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                return status?.timerA?.state === 'running'
            },
        },
        timer_a_paused: {
            type: 'boolean',
            name: 'Timer A Paused',
            description: 'Changes style when Timer A is paused',
            defaultStyle: {
                bgcolor: combineRgb(255, 255, 0),
                color: combineRgb(0, 0, 0),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                return status?.timerA?.state === 'paused'
            },
        },
        timer_a_warning: {
            type: 'boolean',
            name: 'Timer A in Warning Time',
            description: 'Changes style when Timer A is in warning period',
            defaultStyle: {
                bgcolor: combineRgb(255, 165, 0),
                color: combineRgb(0, 0, 0),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                const timer = status?.timerA
                if (!timer) return false

                // The app reports this directly; fall back for older versions.
                if (typeof timer.isWarning === 'boolean') return timer.isWarning

                const timeLeft = timer.duration - timer.currentTime
                return timeLeft <= timer.warningTime && timeLeft > 0
            },
        },
        timer_a_overtime: {
            type: 'boolean',
            name: 'Timer A Overtime',
            description: 'Changes style when Timer A is in overtime',
            defaultStyle: {
                bgcolor: combineRgb(255, 0, 0),
                color: combineRgb(255, 255, 255),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                const timer = status?.timerA
                if (!timer) return false

                // With a Count Up end behaviour the app keeps the state as
                // "running" past zero, so rely on its computed flag.
                if (typeof timer.isOvertime === 'boolean') return timer.isOvertime

                return timer.state === 'overtime'
            },
        },
        timer_b_running: {
            type: 'boolean',
            name: 'Timer B Running',
            description: 'Changes style when Timer B is running',
            defaultStyle: {
                bgcolor: combineRgb(0, 255, 0),
                color: combineRgb(0, 0, 0),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                return status?.timerB?.state === 'running'
            },
        },
        timer_b_paused: {
            type: 'boolean',
            name: 'Timer B Paused',
            description: 'Changes style when Timer B is paused',
            defaultStyle: {
                bgcolor: combineRgb(255, 255, 0),
                color: combineRgb(0, 0, 0),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                return status?.timerB?.state === 'paused'
            },
        },
        timer_b_warning: {
            type: 'boolean',
            name: 'Timer B in Warning Time',
            description: 'Changes style when Timer B is in warning period',
            defaultStyle: {
                bgcolor: combineRgb(255, 165, 0),
                color: combineRgb(0, 0, 0),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                const timer = status?.timerB
                if (!timer) return false

                // The app reports this directly; fall back for older versions.
                if (typeof timer.isWarning === 'boolean') return timer.isWarning

                const timeLeft = timer.duration - timer.currentTime
                return timeLeft <= timer.warningTime && timeLeft > 0
            },
        },
        timer_b_overtime: {
            type: 'boolean',
            name: 'Timer B Overtime',
            description: 'Changes style when Timer B is in overtime',
            defaultStyle: {
                bgcolor: combineRgb(255, 0, 0),
                color: combineRgb(255, 255, 255),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                const timer = status?.timerB
                if (!timer) return false

                // With a Count Up end behaviour the app keeps the state as
                // "running" past zero, so rely on its computed flag.
                if (typeof timer.isOvertime === 'boolean') return timer.isOvertime

                return timer.state === 'overtime'
            },
        },
        display_visible: {
            type: 'boolean',
            name: 'Output Enabled',
            description: 'Changes style when the output window is up',
            defaultStyle: {
                bgcolor: combineRgb(0, 0, 255),
                color: combineRgb(255, 255, 255),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                return status?.displayShown === true
            },
        },
        timer_visible: {
            type: 'boolean',
            name: 'Timer Visible',
            description: 'Changes style when the timer is showing on the output',
            defaultStyle: {
                bgcolor: combineRgb(0, 128, 255),
                color: combineRgb(255, 255, 255),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                return status?.timerVisible === true
            },
        },
        message_live: {
            type: 'boolean',
            name: 'Live Message Active',
            description: 'Changes style when a live message is active',
            defaultStyle: {
                bgcolor: combineRgb(255, 0, 0),
                color: combineRgb(255, 255, 255),
            },
            options: [],
            callback: (feedback: CompanionFeedbackInfo): boolean => {
                const status = instance.getAppStatus()
                return status?.messageIsLive === true
            },
        },
    }
}