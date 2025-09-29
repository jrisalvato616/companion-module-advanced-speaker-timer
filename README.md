# companion-module-advanced-speaker-timer

BitFocus Companion module for controlling Advanced Speaker Timer Pro.

## Features

This module allows you to control Advanced Speaker Timer Pro from BitFocus Companion, providing:

### Actions
- **Timer Control**: Start, pause, reset Timer A and Timer B
- **Time Adjustment**: Add/subtract time from timers (customizable amounts or quick 30s/1min buttons)
- **Display Control**: Show, hide, or toggle the timer display
- **Message Control**: Toggle live messages and set custom message text
- **Preset Application**: Apply timer presets to either timer
- **Status Requests**: Request current status updates from the app

### Feedbacks
- **Timer States**: Visual feedback for running, paused, warning, and overtime states
- **Display Status**: Shows when the display is visible
- **Message Status**: Shows when a live message is active

### Variables
- **Timer Information**: Current time, remaining time, duration, and state for both timers
- **Display Status**: Whether the display is shown
- **Message Information**: Live message status and text

## Installation

### Prerequisites
1. Advanced Speaker Timer Pro with TCP server enabled (port 8765 by default)
2. BitFocus Companion v3.0 or later

### Installing the Module

1. **Development Installation**:
   ```bash
   cd companion-module-advanced-speaker-timer
   yarn install
   yarn build
   ```

2. **Production Installation**:
   - Copy the built module to your Companion modules directory
   - Or submit to the Companion module repository for official inclusion

## Configuration

1. **In Advanced Speaker Timer Pro**:
   - The TCP server should start automatically on port 8765
   - Make note of the IP address of the machine running the app

2. **In Companion**:
   - Add a new "Advanced Speaker Timer Pro" connection
   - Configure the IP address (default: 127.0.0.1 for same machine)
   - Configure the TCP port (default: 8765)
   - The module will attempt to connect automatically

## Usage Examples

### Basic Timer Control
- **Start/Pause/Reset**: Use the basic timer control actions for Timer A or Timer B
- **Quick Time Adjustments**: Use +30s, +1min, -30s, -1min buttons for quick adjustments
- **Custom Adjustments**: Use the "Adjust Timer" action with custom values

### Display Management
- **Show Display**: Makes the timer visible on the selected screen
- **Hide Display**: Hides the timer display
- **Toggle Display**: Switches display visibility with one button

### Message Control
- **Toggle Message**: Show/hide live messages
- **Set Message**: Display custom messages (e.g., "Break Time", "Q&A")

### Feedback Usage
- **Visual Status**: Buttons change color based on timer state (green=running, yellow=paused, orange=warning, red=overtime)
- **Display Indicator**: Button shows when display is active
- **Message Indicator**: Button shows when live message is displayed

### Variables in Text
Use variables like `$(advanced-speaker-timer:timer_a_remaining_time_formatted)` in button text to show live timer information.

## Network Requirements

- TCP connection on port 8765 (configurable)
- Both Companion and Advanced Speaker Timer Pro must be on the same network
- Firewall may need to allow the TCP connection

## Troubleshooting

### Connection Issues
1. **Check IP Address**: Ensure the correct IP address is configured
2. **Check Port**: Verify the TCP port matches between app and module (default: 8765)
3. **Network Access**: Ensure both devices can communicate on the network
4. **Firewall**: Check that the TCP port is not blocked

### App Issues
1. **TCP Server**: Verify the TCP server is running in Advanced Speaker Timer Pro
2. **App Running**: Ensure Advanced Speaker Timer Pro is running and active

### Module Issues
1. **Connection Status**: Check the module status in Companion's connections tab
2. **Logs**: Check Companion logs for detailed error information
3. **Restart**: Try restarting the module connection

## Development

### Building
```bash
yarn install
yarn build
```

### Development Mode
```bash
yarn dev  # Watches for changes and rebuilds automatically
```

### Testing
- Start Advanced Speaker Timer Pro
- Configure and test the connection in Companion
- Test all actions, feedbacks, and variables

## API Reference

### Commands Sent to App
The module sends JSON commands over TCP:

```json
{"action": "start", "timer": "A"}
{"action": "pause", "timer": "B"}
{"action": "adjust", "timer": "A", "value": "30"}
{"action": "showDisplay"}
{"action": "setMessage", "message": "Break Time"}
{"action": "status"}
```

### Responses from App
The app responds with JSON status updates:

```json
{
  "status": "ok",
  "data": {
    "timerA": {"state": "running", "currentTime": 120, "duration": 300, "warningTime": 60, "label": "Timer A"},
    "timerB": {"state": "ready", "currentTime": 0, "duration": 600, "warningTime": 120, "label": "Timer B"},
    "displayShown": true,
    "messageIsLive": false,
    "liveMessage": ""
  }
}
```

## License

MIT License - See LICENSE file for details