"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedSpeakerTimerInstance = exports.READ_ONLY_ACTIONS = void 0;
const base_1 = require("@companion-module/base");
const actions_1 = require("./actions");
const feedbacks_1 = require("./feedbacks");
const variables_1 = require("./variables");
const config_1 = require("./config");
const presets_1 = require("./presets");
const net_1 = require("net");
const string_decoder_1 = require("string_decoder");
const selection_1 = require("./selection");
exports.READ_ONLY_ACTIONS = new Set(['status', 'getTimerPresets', 'getMessagePresets']);
const STATUS_TIMEOUT_MS = 5000;
class AdvancedSpeakerTimerInstance extends base_1.InstanceBase {
    constructor(internal) {
        super(internal);
        this.socket = null;
        this.reconnectTimer = null;
        this.statusPollTimer = null;
        this.connected = false;
        this.destroyed = false;
        this.connectedAt = 0;
        this.availability = 'disconnected';
        this.appStatus = null;
        /** When the app last told us its state, pushed or polled. */
        this.lastStatusAt = 0;
        // The app's presets, and what a rotary has scrolled to in each list.
        this.timerPresets = new selection_1.PresetSelection();
        this.messagePresets = new selection_1.PresetSelection();
        this.timerPresetsReady = false;
        this.messagePresetsReady = false;
    }
    async init(config) {
        this.config = config;
        this.updateStatus(base_1.InstanceStatus.Connecting);
        this.setActionDefinitions((0, actions_1.GetActionsList)(this));
        this.setFeedbackDefinitions((0, feedbacks_1.GetFeedbacksList)(this));
        this.setVariableDefinitions((0, variables_1.GetVariableDefinitions)());
        this.setPresetDefinitions((0, presets_1.GetPresetList)(this));
        this.updateHighlightVariables();
        this.initConnection();
    }
    async destroy() {
        this.destroyed = true;
        this.clearReconnectTimer();
        this.closeSocket();
        this.setUnavailable('disconnected');
    }
    async configUpdated(config) {
        this.config = config;
        this.initConnection();
    }
    getConfigFields() {
        return (0, config_1.GetConfigFields)();
    }
    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    closeSocket() {
        this.stopStatusPolling();
        this.connected = false;
        // Invalidate the identity before destroying: its queued callbacks must
        // not alter the replacement connection or reconnect a destroyed instance.
        const socket = this.socket;
        this.socket = null;
        socket === null || socket === void 0 ? void 0 : socket.destroy();
        // Keep the selected identity for a reconnect, but never expose the old
        // app's preset catalog while awaiting the new connection's lists.
        this.timerPresetsReady = false;
        this.messagePresetsReady = false;
        this.updateHighlightVariables();
        this.setActionDefinitions((0, actions_1.GetActionsList)(this));
        this.setPresetDefinitions((0, presets_1.GetPresetList)(this));
    }
    setUnavailable(reason) {
        const changed = this.appStatus !== null || this.availability !== reason;
        this.appStatus = null;
        this.availability = reason;
        this.setVariableValues({ ...(0, variables_1.GetUnavailableVariableValues)(), connection_status: reason });
        if (changed)
            this.checkFeedbacks();
    }
    initConnection() {
        if (this.destroyed)
            return;
        this.clearReconnectTimer();
        this.closeSocket();
        this.lastStatusAt = 0;
        this.setUnavailable('connecting');
        this.updateStatus(base_1.InstanceStatus.Connecting);
        const socket = new net_1.Socket();
        this.socket = socket;
        const isCurrent = () => !this.destroyed && this.socket === socket;
        // Decode across packet boundaries so split accented letters and emoji
        // survive. Each connection has its own decoder and partial line buffer.
        const decoder = new string_decoder_1.StringDecoder('utf8');
        let rxBuffer = '';
        socket.on('connect', () => {
            if (!isCurrent())
                return;
            this.log('info', 'Connected to Advanced Speaker Timer Pro');
            this.connected = true;
            this.connectedAt = Date.now();
            this.setUnavailable('waiting');
            this.clearReconnectTimer();
            this.sendCommand({ action: 'status' });
            this.refreshPresets();
            this.startStatusPolling();
        });
        socket.on('data', (data) => {
            var _a;
            if (!isCurrent())
                return;
            rxBuffer += decoder.write(data);
            if (rxBuffer.length > 1000000) {
                this.log('warn', 'Disconnecting after oversized response buffer');
                this.closeSocket();
                this.setUnavailable('disconnected');
                this.updateStatus(base_1.InstanceStatus.ConnectionFailure);
                this.scheduleReconnect();
                return;
            }
            const lines = rxBuffer.split('\n');
            rxBuffer = (_a = lines.pop()) !== null && _a !== void 0 ? _a : '';
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    this.handleResponse(JSON.parse(line));
                }
                catch (error) {
                    this.log('warn', `Error parsing response: ${error}`);
                }
            }
        });
        socket.on('error', (error) => {
            if (!isCurrent())
                return;
            this.log('warn', `Connection error: ${error.message}`);
            this.closeSocket();
            this.setUnavailable('disconnected');
            this.updateStatus(base_1.InstanceStatus.ConnectionFailure);
            this.scheduleReconnect();
        });
        socket.on('close', () => {
            if (!isCurrent())
                return;
            this.log('warn', 'Connection closed');
            this.closeSocket();
            this.setUnavailable('disconnected');
            this.updateStatus(base_1.InstanceStatus.Disconnected);
            this.scheduleReconnect();
        });
        try {
            socket.connect(this.config.port, this.config.host);
        }
        catch (error) {
            this.log('error', `Failed to connect: ${error}`);
            this.closeSocket();
            this.setUnavailable('disconnected');
            this.updateStatus(base_1.InstanceStatus.ConnectionFailure);
            this.scheduleReconnect();
        }
    }
    /**
     * A fallback: apps from 1.6.1 push their status as it changes, so this only
     * asks when nothing has arrived recently (an older app, or an idle one).
     */
    startStatusPolling() {
        this.stopStatusPolling();
        this.statusPollTimer = setInterval(() => {
            if (!this.connected)
                return;
            const age = Date.now() - (this.lastStatusAt || this.connectedAt);
            if (age >= STATUS_TIMEOUT_MS && this.availability !== 'stale') {
                this.setUnavailable('stale');
                this.updateStatus(base_1.InstanceStatus.ConnectionFailure, 'No recent timer status');
            }
            if (age > 1500)
                this.sendCommand({ action: 'status' });
        }, 1000);
    }
    stopStatusPolling() {
        if (this.statusPollTimer) {
            clearInterval(this.statusPollTimer);
            this.statusPollTimer = null;
        }
    }
    scheduleReconnect() {
        if (this.destroyed || this.reconnectTimer)
            return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.destroyed)
                return;
            this.log('info', 'Attempting to reconnect...');
            this.initConnection();
        }, 5000);
    }
    handleResponse(response) {
        var _a, _b, _c, _d;
        if (response.status === 'error') {
            this.log('warn', `App rejected ${(_a = response.action) !== null && _a !== void 0 ? _a : 'command'}: ${(_b = response.message) !== null && _b !== void 0 ? _b : 'Unknown error'}`);
            return;
        }
        // Preset lists arrive as a top-level action rather than under `data`.
        if (response.action === 'timerPresets' && Array.isArray(response.presets)) {
            this.timerPresets.setItems(response.presets.map((p) => ({ id: p.id, name: p.name, duration: p.duration })));
            this.timerPresetsReady = true;
            this.updateHighlightVariables();
            this.setActionDefinitions((0, actions_1.GetActionsList)(this));
            this.setPresetDefinitions((0, presets_1.GetPresetList)(this));
            return;
        }
        if (response.action === 'messagePresets' && Array.isArray(response.presets)) {
            this.messagePresets.setItems(response.presets.map((p) => ({ id: p.id, name: p.name })));
            this.messagePresetsReady = true;
            this.updateHighlightVariables();
            this.setActionDefinitions((0, actions_1.GetActionsList)(this));
            this.setPresetDefinitions((0, presets_1.GetPresetList)(this));
            return;
        }
        // The app broadcasts when presets are added, edited, reordered or
        // deleted, so pull the lists again to keep the dropdowns current.
        if (((_c = response.action) === null || _c === void 0 ? void 0 : _c.startsWith('timerPreset')) || ((_d = response.action) === null || _d === void 0 ? void 0 : _d.startsWith('messagePreset'))) {
            this.refreshPresets();
            return;
        }
        if (response.status === 'ok' && response.data) {
            // Check if this is a status response
            if (response.data.timerA && response.data.timerB) {
                this.lastStatusAt = Date.now();
                this.appStatus = response.data;
                this.availability = 'connected';
                this.updateStatus(base_1.InstanceStatus.Ok);
                this.setVariableValues({ connection_status: 'connected' });
                this.updateVariables();
                this.checkFeedbacks();
            }
        }
    }
    refreshPresets() {
        this.sendCommand({ action: 'getTimerPresets', timer: 'A' });
        this.sendCommand({ action: 'getMessagePresets' });
    }
    // MARK: Scrolling presets with a rotary
    /** Scrolls the highlighted timer preset, wrapping at both ends. */
    moveTimerPresetHighlight(step) {
        if (!this.timerPresetsReady)
            return;
        this.timerPresets.move(step);
        this.updateHighlightVariables();
    }
    moveMessagePresetHighlight(step) {
        if (!this.messagePresetsReady)
            return;
        this.messagePresets.move(step);
        this.updateHighlightVariables();
    }
    highlightedTimerPresetInfo() {
        return this.timerPresetsReady ? this.timerPresets.current : undefined;
    }
    highlightedMessagePresetInfo() {
        return this.messagePresetsReady ? this.messagePresets.current : undefined;
    }
    /** Feeds the little display above a rotary. */
    updateHighlightVariables() {
        var _a, _b;
        const timer = this.highlightedTimerPresetInfo();
        const message = this.highlightedMessagePresetInfo();
        this.setVariableValues({
            selected_timer_preset: (_a = timer === null || timer === void 0 ? void 0 : timer.name) !== null && _a !== void 0 ? _a : '—',
            selected_timer_preset_duration: (timer === null || timer === void 0 ? void 0 : timer.duration) === undefined ? '' : (0, variables_1.formatTime)(timer.duration),
            selected_timer_preset_number: this.timerPresetsReady ? this.timerPresets.position : '0/0',
            selected_message_preset: (_b = message === null || message === void 0 ? void 0 : message.name) !== null && _b !== void 0 ? _b : '—',
            selected_message_preset_number: this.messagePresetsReady ? this.messagePresets.position : '0/0',
        });
    }
    getTimerPresets() {
        return this.timerPresetsReady ? this.timerPresets.all : [];
    }
    getMessagePresets() {
        return this.messagePresetsReady ? this.messagePresets.all : [];
    }
    updateVariables() {
        if (!this.appStatus)
            return;
        const variables = (0, variables_1.GetVariableValues)(this.appStatus);
        this.setVariableValues(variables);
    }
    sendCommand(command) {
        if (!this.socket || !this.connected) {
            this.log('warn', 'Not connected to Advanced Speaker Timer Pro');
            return;
        }
        try {
            this.socket.write(JSON.stringify(command) + '\n');
            // A press should show on the button now, not on the next poll up to
            // a second later. The app answers commands in order, so this status
            // reflects the change. Written directly to avoid recursing here.
            if (!exports.READ_ONLY_ACTIONS.has(command.action)) {
                this.socket.write(JSON.stringify({ action: 'status' }) + '\n');
            }
        }
        catch (error) {
            this.log('error', `Failed to send command: ${error}`);
        }
    }
    hasCurrentStatus() {
        return this.connected && this.appStatus !== null && Date.now() - this.lastStatusAt < STATUS_TIMEOUT_MS;
    }
    getAppStatus() {
        return this.hasCurrentStatus() ? this.appStatus : null;
    }
    toggleTimer(timer) {
        var _a;
        const status = this.getAppStatus();
        if (!status) {
            this.log('warn', 'Cannot toggle a timer until current status is available');
            this.requestStatus();
            return;
        }
        if ((_a = status.capabilities) === null || _a === void 0 ? void 0 : _a.includes('toggleTimer')) {
            this.sendCommand({ action: 'toggleTimer', timer });
        }
        else {
            // Older apps have only explicit start/pause commands.
            const state = timer === 'A' ? status.timerA.state : status.timerB.state;
            this.sendCommand({ action: state === 'running' ? 'pause' : 'start', timer });
        }
    }
    sendDraftMessage() {
        var _a;
        const status = this.getAppStatus();
        if (!status) {
            this.log('warn', 'Cannot send the draft until current status is available');
            this.requestStatus();
            return;
        }
        if (!((_a = status.capabilities) === null || _a === void 0 ? void 0 : _a.includes('showMessage'))) {
            this.log('warn', 'Send Draft requires an updated app; older apps can use Toggle Live Message');
            return;
        }
        // Resolve the draft in the app, after earlier preset recalls. Reading a
        // cached liveMessage here could send the previous draft in a macro.
        this.sendCommand({ action: 'showMessage' });
    }
    requestStatus() {
        this.sendCommand({ action: 'status' });
    }
}
exports.AdvancedSpeakerTimerInstance = AdvancedSpeakerTimerInstance;
exports.default = AdvancedSpeakerTimerInstance;
// Hands the instance to Companion and starts the IPC handshake. Without this
// the process loads, defines the class, and exits — which Companion reports as
// "Failed to initialize instance: Restart forced".
(0, base_1.runEntrypoint)(AdvancedSpeakerTimerInstance, []);
//# sourceMappingURL=index.js.map