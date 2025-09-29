# Installing Advanced Speaker Timer Module in Companion v4.0.1

## Quick Installation

1. **Copy the built module to Companion's development directory**:
   ```bash
   mkdir -p ~/companion-modules-dev/
   cp -r "/Users/jrisalvato/Documents/Xcode Projects/Advanced Speaker Timer Pro/companion-module-advanced-speaker-timer" ~/companion-modules-dev/
   ```

2. **Restart Companion completely** (Quit and reopen the app)

3. **Enable Developer Mode in Companion**:
   - Open Companion
   - Go to Settings/Preferences
   - Look for "Developer Mode" or "Advanced Settings"
   - Enable "Load modules from development folder"

## Alternative Method: Manual Installation

1. **Open Companion's module folder**:
   - **macOS**: `~/companion-modules-dev/` or `~/Library/Application Support/companion/modules/`
   - **Windows**: `%APPDATA%/companion/modules/`
   - **Linux**: `~/.config/companion/modules/`

2. **Copy the entire module folder** to this location

3. **Restart Companion**

## Adding the Connection

1. **Open Companion**
2. **Go to "Connections" tab**
3. **Click "Add Connection" or the "+" button**
4. **Search for "Advanced Speaker Timer"** in the module list
   - If it doesn't appear, try searching for "speaker-timer" or "timer"
5. **Select the module and configure**:
   - **Host**: `127.0.0.1` (same machine) or the IP of your Mac
   - **Port**: `8765` (default)
6. **Click Save**

## Testing the Connection

1. **Start your Advanced Speaker Timer Pro app** (make sure TCP server is running on port 8765)
2. **In Companion**, the connection status should show "OK" or "Connected"
3. **Create a test button**:
   - Go to "Buttons" tab
   - Click on an empty button
   - Add action: "Advanced Speaker Timer Pro" > "Start Timer A"
   - Click the button to test

## Troubleshooting

### Module Not Appearing
- Check that the module is in the correct directory: `~/companion-modules-dev/companion-module-advanced-speaker-timer/`
- Verify the `dist/` folder exists with compiled `.js` files
- Restart Companion completely
- Check Companion logs for module loading errors

### Connection Issues
- Verify Advanced Speaker Timer Pro is running
- Check that TCP server is active (should see "Companion TCP server listening on port 8765" in console/logs)
- Try connecting with the test script: `node test-connection.js`
- Check firewall settings

### Button Not Working
- Verify connection status is "OK"
- Check Advanced Speaker Timer Pro console for received commands
- Try the "Request Status" action first to test basic communication

## Module Features Available

### Actions
- **Timer Control**: Start/Pause/Reset for Timer A and B
- **Time Adjustment**: Add/subtract 30s, 1min, or custom amounts
- **Display Control**: Show/Hide/Toggle display
- **Messages**: Set live messages, toggle message display
- **Presets**: Apply timer presets to either timer

### Feedbacks (Visual Indicators)
- Timer running/paused/warning/overtime states
- Display visible status
- Live message active status

### Variables
- Timer times, states, durations
- Display and message status
- Use in button text: `$(advanced-speaker-timer:timer_a_remaining_time_formatted)`