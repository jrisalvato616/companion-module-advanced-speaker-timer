import { InstanceBase, InstanceStatus, SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import { GetActionsList } from './actions'
import { GetFeedbacksList } from './feedbacks'
import { GetVariableDefinitions, GetVariableValues, GetUnavailableVariableValues, formatTime } from './variables'
import { SpeakerTimerConfig, GetConfigFields } from './config'
import { GetPresetList } from './presets'
import { Socket } from 'net'
import { StringDecoder } from 'string_decoder'
import { PresetInfo, PresetSelection } from './selection'

interface CompanionCommand {
    action: string
    timer?: string
    value?: string
    presetId?: string
    message?: string
    layout?: string
    send?: boolean
}

export /** Commands that only read; everything else changes the app. */
const READ_ONLY_ACTIONS = new Set(['status', 'getTimerPresets', 'getMessagePresets'])

export type { PresetInfo } from './selection'

interface CompanionResponse {
    status?: string
    message?: string
    /** Present on preset lists and on broadcast notifications. */
    action?: string
    data?: any
    presets?: Array<{ id: string; name: string; duration?: number }>
}

interface TimerStatus {
    state: string
    currentTime: number
    duration: number
    warningTime: number
    label: string
    /** Optional: older app versions don't report these. */
    mode?: string
    isWarning?: boolean
    isOvertime?: boolean
    displayText?: string
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
    /** Timer mode name, e.g. "Clock + Timer". Optional: older app versions don't report it. */
    layout?: string
    capabilities?: string[]
    displayedMessage?: string
}

const STATUS_TIMEOUT_MS = 5000

export class AdvancedSpeakerTimerInstance extends InstanceBase<SpeakerTimerConfig> {
    private socket: Socket | null = null
    private reconnectTimer: NodeJS.Timeout | null = null
    private statusPollTimer: NodeJS.Timeout | null = null
    private connected = false
    private destroyed = false
    private connectedAt = 0
    private availability = 'disconnected'
    private appStatus: AppStatus | null = null
    /** When the app last told us its state, pushed or polled. */
    private lastStatusAt = 0
    // The app's presets, and what a rotary has scrolled to in each list.
    private timerPresets = new PresetSelection()
    private messagePresets = new PresetSelection()
    private timerPresetsReady = false
    private messagePresetsReady = false
    public config!: SpeakerTimerConfig

    constructor(internal: unknown) {
        super(internal)
    }

    async init(config: SpeakerTimerConfig): Promise<void> {
        this.config = config
        this.updateStatus(InstanceStatus.Connecting)

        this.setActionDefinitions(GetActionsList(this))
        this.setFeedbackDefinitions(GetFeedbacksList(this))
        this.setVariableDefinitions(GetVariableDefinitions())
        this.setPresetDefinitions(GetPresetList(this))
        this.updateHighlightVariables()

        this.initConnection()
    }

    async destroy(): Promise<void> {
        this.destroyed = true
        this.clearReconnectTimer()
        this.closeSocket()
        this.setUnavailable('disconnected')
    }

    async configUpdated(config: SpeakerTimerConfig): Promise<void> {
        this.config = config
        this.initConnection()
    }

    getConfigFields(): SomeCompanionConfigField[] {
        return GetConfigFields()
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
    }

    private closeSocket(): void {
        this.stopStatusPolling()
        this.connected = false
        // Invalidate the identity before destroying: its queued callbacks must
        // not alter the replacement connection or reconnect a destroyed instance.
        const socket = this.socket
        this.socket = null
        socket?.destroy()
        // Keep the selected identity for a reconnect, but never expose the old
        // app's preset catalog while awaiting the new connection's lists.
        this.timerPresetsReady = false
        this.messagePresetsReady = false
        this.updateHighlightVariables()
        this.setActionDefinitions(GetActionsList(this))
        this.setPresetDefinitions(GetPresetList(this))
    }

    private setUnavailable(reason: string): void {
        const changed = this.appStatus !== null || this.availability !== reason
        this.appStatus = null
        this.availability = reason
        this.setVariableValues({ ...GetUnavailableVariableValues(), connection_status: reason })
        if (changed) this.checkFeedbacks()
    }

    private initConnection(): void {
        if (this.destroyed) return
        this.clearReconnectTimer()
        this.closeSocket()
        this.lastStatusAt = 0
        this.setUnavailable('connecting')
        this.updateStatus(InstanceStatus.Connecting)

        const socket = new Socket()
        this.socket = socket
        const isCurrent = () => !this.destroyed && this.socket === socket
        // Decode across packet boundaries so split accented letters and emoji
        // survive. Each connection has its own decoder and partial line buffer.
        const decoder = new StringDecoder('utf8')
        let rxBuffer = ''

        socket.on('connect', () => {
            if (!isCurrent()) return
            this.log('info', 'Connected to Advanced Speaker Timer Pro')
            this.connected = true
            this.connectedAt = Date.now()
            this.setUnavailable('waiting')
            this.clearReconnectTimer()
            this.sendCommand({ action: 'status' })
            this.refreshPresets()
            this.startStatusPolling()
        })

        socket.on('data', (data: Buffer) => {
            if (!isCurrent()) return
            rxBuffer += decoder.write(data)
            if (rxBuffer.length > 1_000_000) {
                this.log('warn', 'Disconnecting after oversized response buffer')
                this.closeSocket()
                this.setUnavailable('disconnected')
                this.updateStatus(InstanceStatus.ConnectionFailure)
                this.scheduleReconnect()
                return
            }

            const lines = rxBuffer.split('\n')
            rxBuffer = lines.pop() ?? ''
            for (const line of lines) {
                if (!line.trim()) continue
                try {
                    this.handleResponse(JSON.parse(line) as CompanionResponse)
                } catch (error) {
                    this.log('warn', `Error parsing response: ${error}`)
                }
            }
        })

        socket.on('error', (error: Error) => {
            if (!isCurrent()) return
            this.log('warn', `Connection error: ${error.message}`)
            this.closeSocket()
            this.setUnavailable('disconnected')
            this.updateStatus(InstanceStatus.ConnectionFailure)
            this.scheduleReconnect()
        })

        socket.on('close', () => {
            if (!isCurrent()) return
            this.log('warn', 'Connection closed')
            this.closeSocket()
            this.setUnavailable('disconnected')
            this.updateStatus(InstanceStatus.Disconnected)
            this.scheduleReconnect()
        })

        try {
            socket.connect(this.config.port, this.config.host)
        } catch (error) {
            this.log('error', `Failed to connect: ${error}`)
            this.closeSocket()
            this.setUnavailable('disconnected')
            this.updateStatus(InstanceStatus.ConnectionFailure)
            this.scheduleReconnect()
        }
    }

    /**
     * A fallback: apps from 1.6.1 push their status as it changes, so this only
     * asks when nothing has arrived recently (an older app, or an idle one).
     */
    private startStatusPolling(): void {
        this.stopStatusPolling()
        this.statusPollTimer = setInterval(() => {
            if (!this.connected) return
            const age = Date.now() - (this.lastStatusAt || this.connectedAt)
            if (age >= STATUS_TIMEOUT_MS && this.availability !== 'stale') {
                this.setUnavailable('stale')
                this.updateStatus(InstanceStatus.ConnectionFailure, 'No recent timer status')
            }
            if (age > 1500) this.sendCommand({ action: 'status' })
        }, 1000)
    }

    private stopStatusPolling(): void {
        if (this.statusPollTimer) {
            clearInterval(this.statusPollTimer)
            this.statusPollTimer = null
        }
    }

    private scheduleReconnect(): void {
        if (this.destroyed || this.reconnectTimer) return

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            if (this.destroyed) return
            this.log('info', 'Attempting to reconnect...')
            this.initConnection()
        }, 5000)
    }

    private handleResponse(response: CompanionResponse): void {
        if (response.status === 'error') {
            this.log('warn', `App rejected ${response.action ?? 'command'}: ${response.message ?? 'Unknown error'}`)
            return
        }
        // Preset lists arrive as a top-level action rather than under `data`.
        if (response.action === 'timerPresets' && Array.isArray(response.presets)) {
            this.timerPresets.setItems(response.presets.map((p) => ({ id: p.id, name: p.name, duration: p.duration })))
            this.timerPresetsReady = true
            this.updateHighlightVariables()
            this.setActionDefinitions(GetActionsList(this))
            this.setPresetDefinitions(GetPresetList(this))
            return
        }
        if (response.action === 'messagePresets' && Array.isArray(response.presets)) {
            this.messagePresets.setItems(response.presets.map((p) => ({ id: p.id, name: p.name })))
            this.messagePresetsReady = true
            this.updateHighlightVariables()
            this.setActionDefinitions(GetActionsList(this))
            this.setPresetDefinitions(GetPresetList(this))
            return
        }
        // The app broadcasts when presets are added, edited, reordered or
        // deleted, so pull the lists again to keep the dropdowns current.
        if (response.action?.startsWith('timerPreset') || response.action?.startsWith('messagePreset')) {
            this.refreshPresets()
            return
        }

        if (response.status === 'ok' && response.data) {
            // Check if this is a status response
            if (response.data.timerA && response.data.timerB) {
                this.lastStatusAt = Date.now()
                this.appStatus = response.data as AppStatus
                this.availability = 'connected'
                this.updateStatus(InstanceStatus.Ok)
                this.setVariableValues({ connection_status: 'connected' })
                this.updateVariables()
                this.checkFeedbacks()
            }
        }
    }

    private refreshPresets(): void {
        this.sendCommand({ action: 'getTimerPresets', timer: 'A' })
        this.sendCommand({ action: 'getMessagePresets' })
    }

    // MARK: Scrolling presets with a rotary

    /** Scrolls the highlighted timer preset, wrapping at both ends. */
    public moveTimerPresetHighlight(step: number): void {
        if (!this.timerPresetsReady) return
        this.timerPresets.move(step)
        this.updateHighlightVariables()
    }

    public moveMessagePresetHighlight(step: number): void {
        if (!this.messagePresetsReady) return
        this.messagePresets.move(step)
        this.updateHighlightVariables()
    }

    public highlightedTimerPresetInfo(): PresetInfo | undefined {
        return this.timerPresetsReady ? this.timerPresets.current : undefined
    }

    public highlightedMessagePresetInfo(): PresetInfo | undefined {
        return this.messagePresetsReady ? this.messagePresets.current : undefined
    }

    /** Feeds the little display above a rotary. */
    private updateHighlightVariables(): void {
        const timer = this.highlightedTimerPresetInfo()
        const message = this.highlightedMessagePresetInfo()
        this.setVariableValues({
            selected_timer_preset: timer?.name ?? '—',
            selected_timer_preset_duration: timer?.duration === undefined ? '' : formatTime(timer.duration),
            selected_timer_preset_number: this.timerPresetsReady ? this.timerPresets.position : '0/0',
            selected_message_preset: message?.name ?? '—',
            selected_message_preset_number: this.messagePresetsReady ? this.messagePresets.position : '0/0',
        })
    }

    public getTimerPresets(): PresetInfo[] {
        return this.timerPresetsReady ? this.timerPresets.all : []
    }

    public getMessagePresets(): PresetInfo[] {
        return this.messagePresetsReady ? this.messagePresets.all : []
    }

    private updateVariables(): void {
        if (!this.appStatus) return

        const variables = GetVariableValues(this.appStatus)
        this.setVariableValues(variables)
    }

    public sendCommand(command: CompanionCommand): void {
        if (!this.socket || !this.connected) {
            this.log('warn', 'Not connected to Advanced Speaker Timer Pro')
            return
        }

        try {
            this.socket.write(JSON.stringify(command) + '\n')
            // A press should show on the button now, not on the next poll up to
            // a second later. The app answers commands in order, so this status
            // reflects the change. Written directly to avoid recursing here.
            if (!READ_ONLY_ACTIONS.has(command.action)) {
                this.socket.write(JSON.stringify({ action: 'status' }) + '\n')
            }
        } catch (error) {
            this.log('error', `Failed to send command: ${error}`)
        }
    }

    public hasCurrentStatus(): boolean {
        return this.connected && this.appStatus !== null && Date.now() - this.lastStatusAt < STATUS_TIMEOUT_MS
    }

    public getAppStatus(): AppStatus | null {
        return this.hasCurrentStatus() ? this.appStatus : null
    }

    public toggleTimer(timer: 'A' | 'B'): void {
        const status = this.getAppStatus()
        if (!status) {
            this.log('warn', 'Cannot toggle a timer until current status is available')
            this.requestStatus()
            return
        }
        if (status.capabilities?.includes('toggleTimer')) {
            this.sendCommand({ action: 'toggleTimer', timer })
        } else {
            // Older apps have only explicit start/pause commands.
            const state = timer === 'A' ? status.timerA.state : status.timerB.state
            this.sendCommand({ action: state === 'running' ? 'pause' : 'start', timer })
        }
    }

    public sendDraftMessage(): void {
        const status = this.getAppStatus()
        if (!status) {
            this.log('warn', 'Cannot send the draft until current status is available')
            this.requestStatus()
            return
        }
        if (!status.capabilities?.includes('showMessage')) {
            this.log('warn', 'Send Draft requires an updated app; older apps can use Toggle Live Message')
            return
        }
        // Resolve the draft in the app, after earlier preset recalls. Reading a
        // cached liveMessage here could send the previous draft in a macro.
        this.sendCommand({ action: 'showMessage' })
    }

    public requestStatus(): void {
        this.sendCommand({ action: 'status' })
    }
}

export default AdvancedSpeakerTimerInstance

// Hands the instance to Companion and starts the IPC handshake. Without this
// the process loads, defines the class, and exits — which Companion reports as
// "Failed to initialize instance: Restart forced".
runEntrypoint(AdvancedSpeakerTimerInstance, [])