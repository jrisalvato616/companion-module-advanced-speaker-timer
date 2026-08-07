import { Regex, InstanceBase, InstanceStatus, SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import { GetActionsList } from './actions'
import { GetFeedbacksList } from './feedbacks'
import { GetVariableDefinitions, GetVariableValues } from './variables'
import { SpeakerTimerConfig, GetConfigFields } from './config'
import { Socket } from 'net'

interface CompanionCommand {
    action: string
    timer?: string
    value?: string
    preset?: string
    message?: string
}

interface CompanionResponse {
    status: string
    data?: any
}

interface TimerStatus {
    state: string
    currentTime: number
    duration: number
    warningTime: number
    label: string
}

interface AppStatus {
    timerA: TimerStatus
    timerB: TimerStatus
    displayShown: boolean
    /** Optional: older app versions don't report this. */
    timerVisible?: boolean
    messageIsLive: boolean
    liveMessage: string
}

export class AdvancedSpeakerTimerInstance extends InstanceBase<SpeakerTimerConfig> {
    private socket: Socket | null = null
    private reconnectTimer: NodeJS.Timeout | null = null
    private connected = false
    private appStatus: AppStatus | null = null
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

        this.initConnection()
    }

    async destroy(): Promise<void> {
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

        this.socket.on('connect', () => {
            this.log('info', 'Connected to Advanced Speaker Timer Pro')
            this.connected = true
            this.updateStatus(InstanceStatus.Ok)

            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer)
                this.reconnectTimer = null
            }

            // Request initial status
            this.sendCommand({ action: 'status' })
        })

        this.socket.on('data', (data: Buffer) => {
            try {
                const lines = data.toString().trim().split('\n')

                for (const line of lines) {
                    if (!line.trim()) continue

                    const response: CompanionResponse = JSON.parse(line)
                    this.handleResponse(response)
                }
            } catch (error) {
                this.log('warn', `Error parsing response: ${error}`)
            }
        })

        this.socket.on('error', (error: Error) => {
            this.log('warn', `Connection error: ${error.message}`)
            this.updateStatus(InstanceStatus.ConnectionFailure)
            this.connected = false
            this.scheduleReconnect()
        })

        this.socket.on('close', () => {
            this.log('warn', 'Connection closed')
            this.updateStatus(InstanceStatus.Disconnected)
            this.connected = false
            this.scheduleReconnect()
        })

        try {
            this.socket.connect(this.config.port, this.config.host)
        } catch (error) {
            this.log('error', `Failed to connect: ${error}`)
            this.scheduleReconnect()
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
        if (response.status === 'ok' && response.data) {
            // Check if this is a status response
            if (response.data.timerA && response.data.timerB) {
                this.appStatus = response.data as AppStatus
                this.updateVariables()
                this.checkFeedbacks()
            }
        }
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
            const jsonString = JSON.stringify(command) + '\n'
            this.socket.write(jsonString)
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