"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedSpeakerTimerInstance = void 0;
const base_1 = require("@companion-module/base");
const actions_1 = require("./actions");
const feedbacks_1 = require("./feedbacks");
const variables_1 = require("./variables");
const config_1 = require("./config");
const net_1 = require("net");
class AdvancedSpeakerTimerInstance extends base_1.InstanceBase {
    constructor(internal) {
        super(internal);
        this.socket = null;
        this.reconnectTimer = null;
        this.statusPollTimer = null;
        this.rxBuffer = '';
        this.connected = false;
        this.appStatus = null;
        this.timerPresets = [];
        this.messagePresets = [];
    }
    async init(config) {
        this.config = config;
        this.updateStatus(base_1.InstanceStatus.Connecting);
        this.setActionDefinitions((0, actions_1.GetActionsList)(this));
        this.setFeedbackDefinitions((0, feedbacks_1.GetFeedbacksList)(this));
        this.setVariableDefinitions((0, variables_1.GetVariableDefinitions)());
        this.initConnection();
    }
    async destroy() {
        this.stopStatusPolling();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
    }
    async configUpdated(config) {
        this.config = config;
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        this.initConnection();
    }
    getConfigFields() {
        return (0, config_1.GetConfigFields)();
    }
    initConnection() {
        if (this.socket) {
            this.socket.destroy();
        }
        this.socket = new net_1.Socket();
        this.connected = false;
        this.rxBuffer = '';
        this.socket.on('connect', () => {
            this.log('info', 'Connected to Advanced Speaker Timer Pro');
            this.connected = true;
            this.updateStatus(base_1.InstanceStatus.Ok);
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            // Request initial status, then keep polling. Without this the
            // module only ever sees the state as it was at connect time, so
            // feedbacks and variables never update.
            this.sendCommand({ action: 'status' });
            this.refreshPresets();
            this.startStatusPolling();
        });
        this.socket.on('data', (data) => {
            var _a;
            // Accumulate, because a JSON message can arrive split across TCP
            // packets. Only whole newline-terminated lines are parsed; any
            // trailing partial line stays buffered for the next chunk.
            this.rxBuffer += data.toString();
            const lines = this.rxBuffer.split('\n');
            this.rxBuffer = (_a = lines.pop()) !== null && _a !== void 0 ? _a : '';
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const response = JSON.parse(line);
                    this.handleResponse(response);
                }
                catch (error) {
                    this.log('warn', `Error parsing response: ${error}`);
                }
            }
        });
        this.socket.on('error', (error) => {
            this.log('warn', `Connection error: ${error.message}`);
            this.updateStatus(base_1.InstanceStatus.ConnectionFailure);
            this.connected = false;
            this.stopStatusPolling();
            this.scheduleReconnect();
        });
        this.socket.on('close', () => {
            this.log('warn', 'Connection closed');
            this.updateStatus(base_1.InstanceStatus.Disconnected);
            this.connected = false;
            this.stopStatusPolling();
            this.scheduleReconnect();
        });
        try {
            this.socket.connect(this.config.port, this.config.host);
        }
        catch (error) {
            this.log('error', `Failed to connect: ${error}`);
            this.scheduleReconnect();
        }
    }
    /** Poll once a second so the countdown variables stay current. */
    startStatusPolling() {
        this.stopStatusPolling();
        this.statusPollTimer = setInterval(() => {
            if (this.connected) {
                this.sendCommand({ action: 'status' });
            }
        }, 1000);
    }
    stopStatusPolling() {
        if (this.statusPollTimer) {
            clearInterval(this.statusPollTimer);
            this.statusPollTimer = null;
        }
    }
    scheduleReconnect() {
        if (this.reconnectTimer) {
            return;
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.log('info', 'Attempting to reconnect...');
            this.initConnection();
        }, 5000);
    }
    handleResponse(response) {
        var _a, _b;
        // Preset lists arrive as a top-level action rather than under `data`.
        if (response.action === 'timerPresets' && Array.isArray(response.presets)) {
            this.timerPresets = response.presets.map((p) => ({ id: p.id, name: p.name }));
            this.setActionDefinitions((0, actions_1.GetActionsList)(this));
            return;
        }
        if (response.action === 'messagePresets' && Array.isArray(response.presets)) {
            this.messagePresets = response.presets.map((p) => ({ id: p.id, name: p.name }));
            this.setActionDefinitions((0, actions_1.GetActionsList)(this));
            return;
        }
        // The app broadcasts when presets are added, edited, reordered or
        // deleted, so pull the lists again to keep the dropdowns current.
        if (((_a = response.action) === null || _a === void 0 ? void 0 : _a.startsWith('timerPreset')) || ((_b = response.action) === null || _b === void 0 ? void 0 : _b.startsWith('messagePreset'))) {
            this.refreshPresets();
            return;
        }
        if (response.status === 'ok' && response.data) {
            // Check if this is a status response
            if (response.data.timerA && response.data.timerB) {
                this.appStatus = response.data;
                this.updateVariables();
                this.checkFeedbacks();
            }
        }
    }
    refreshPresets() {
        this.sendCommand({ action: 'getTimerPresets', timer: 'A' });
        this.sendCommand({ action: 'getMessagePresets' });
    }
    getTimerPresets() {
        return this.timerPresets;
    }
    getMessagePresets() {
        return this.messagePresets;
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
            const jsonString = JSON.stringify(command) + '\n';
            this.socket.write(jsonString);
        }
        catch (error) {
            this.log('error', `Failed to send command: ${error}`);
        }
    }
    getAppStatus() {
        return this.appStatus;
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