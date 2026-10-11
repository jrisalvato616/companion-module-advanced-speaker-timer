import { InstanceBase, InstanceStatus, SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import { GetActionsList } from './actions'
import { GetFeedbacksList } from './feedbacks'
import { GetVariableDefinitions, GetVariableValues, formatTime } from './variables'
import { SpeakerTimerConfig, GetConfigFields } from './config'
import { GetPresetList } from './presets'
import { Socket } from 'net'
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
}

export class AdvancedSpeakerTimerInstance extends InstanceBase<SpeakerTimerConfig> {
    private socket: Socket | null = null
    private reconnectTimer: NodeJS.Timeout | null = null
    private statusPollTimer: NodeJS.Timeout | null = null
    private rxBuffer = ''
    private connected = false
    private appStatus: AppStatus | null = null
    /** When the app last told us its state, pushed or polled. */
    private lastStatusAt = 0
    // The app's presets, and what a rotary has scrolled to in each list.
    private timerPresets = new PresetSelection()
    private messagePresets = new PresetSelection()
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
        this.stopStatusPolling()
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        if (this.socket) {
            this.socket.destroy()
            this.socket = null
        }
    }

    async configUpdated(config: SpeakerTimerConfig): Promise<void> {
        this.config = config

        if (this.socket) {
            this.socket.destroy()
            this.socket = null
        }

        this.initConnection()
    }

    getConfigFields(): SomeCompanionConfigField[] {
        return GetConfigFields()
    }

    private initConnection(): void {
        if (this.socket) {
            this.socket.destroy()
        }

        this.socket = new Socket()
        this.connected = false
        this.rxBuffer = ''

        this.socket.on('connect', () => {
            this.log('info', 'Connected to Advanced Speaker Timer Pro')
            this.connected = true
            this.updateStatus(InstanceStatus.Ok)

            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer)
                this.reconnectTimer = null
            }

            // Request initial status, then keep polling. Without this the
            // module only ever sees the state as it was at connect time, so
            // feedbacks and variables never update.
            this.sendCommand({ action: 'status' })
            this.refreshPresets()
            this.startStatusPolling()
        })

        this.socket.on('data', (data: Buffer) => {
            // Accumulate, because a JSON message can arrive split across TCP
            // packets. Only whole newline-terminated lines are parsed; any
            // trailing partial line stays buffered for the next chunk.
            this.rxBuffer += data.toString()

            // Don't grow without bound if the peer never sends a newline.
            if (this.rxBuffer.length > 1_000_000) {
                this.log('warn', 'Discarding oversized response buffer')
                this.rxBuffer = ''
                return
            }

            const lines = this.rxBuffer.split('\n')
            this.rxBuffer = lines.pop() ?? ''

            for (const line of lines) {
                if (!line.trim()) continue
                try {
                    const response: CompanionResponse = JSON.parse(line)
                    this.handleResponse(response)
                } catch (error) {
                    this.log('warn', `Error parsing response: ${error}`)
                }
            }
        })

        this.socket.on('error', (error: Error) => {
            this.log('warn', `Connection error: ${error.message}`)
            this.updateStatus(InstanceStatus.ConnectionFailure)
            this.connected = false
            this.stopStatusPolling()
            this.scheduleReconnect()
        })

        this.socket.on('close', () => {
            this.log('warn', 'Connection closed')
            this.updateStatus(InstanceStatus.Disconnected)
            this.connected = false
            this.stopStatusPolling()
            this.scheduleReconnect()
        })

        try {
            this.socket.connect(this.config.port, this.config.host)
        } catch (error) {
            this.log('error', `Failed to connect: ${error}`)
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
            if (this.connected && Date.now() - this.lastStatusAt > 1500) {
                this.sendCommand({ action: 'status' })
            }
        }, 1000)
    }

    private stopStatusPolling(): void {
        if (this.statusPollTimer) {
            clearInterval(this.statusPollTimer)
            this.statusPollTimer = null
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            return
        }

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            this.log('info', 'Attempting to reconnect...')
            this.initConnection()
        }, 5000)
    }

    private handleResponse(response: CompanionResponse): void {
        // Preset lists arrive as a top-level action rather than under `data`.
        if (response.action === 'timerPresets' && Array.isArray(response.presets)) {
            this.timerPresets.setItems(response.presets.map((p) => ({ id: p.id, name: p.name, duration: p.duration })))
            this.updateHighlightVariables()
            this.setActionDefinitions(GetActionsList(this))
            this.setPresetDefinitions(GetPresetList(this))
            return
        }
        if (response.action === 'messagePresets' && Array.isArray(response.presets)) {
            this.messagePresets.setItems(response.presets.map((p) => ({ id: p.id, name: p.name })))
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
        this.timerPresets.move(step)
        this.updateHighlightVariables()
    }

    public moveMessagePresetHighlight(step: number): void {
        this.messagePresets.move(step)
        this.updateHighlightVariables()
    }

    public highlightedTimerPresetInfo(): PresetInfo | undefined {
        return this.timerPresets.current
    }

    public highlightedMessagePresetInfo(): PresetInfo | undefined {
        return this.messagePresets.current
    }

    /** Feeds the little display above a rotary. */
    private updateHighlightVariables(): void {
        const timer = this.timerPresets.current
        const message = this.messagePresets.current
        this.setVariableValues({
            selected_timer_preset: timer?.name ?? '—',
            selected_timer_preset_duration: timer?.duration === undefined ? '' : formatTime(timer.duration),
            selected_timer_preset_number: this.timerPresets.position,
            selected_message_preset: message?.name ?? '—',
            selected_message_preset_number: this.messagePresets.position,
        })
    }

    public getTimerPresets(): PresetInfo[] {
        return this.timerPresets.all
    }

    public getMessagePresets(): PresetInfo[] {
        return this.messagePresets.all
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

    public getAppStatus(): AppStatus | null {
        return this.appStatus
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