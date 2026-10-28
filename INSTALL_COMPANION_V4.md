# Installing the Advanced Speaker Timer module in Companion 4 or 5

## Install or update

1. Download `advanced-speaker-timer-1.7.1.tgz` from this repository's GitHub Releases.
2. If you already use Companion, open **Import/Export** and export your configuration as a backup.
3. Open **Modules → Import module package** and select the `.tgz` file. Do not unzip it or copy the source folder into Companion.
4. Open **Connections**. Add an **Advanced Speaker Timer Pro** connection, or edit your existing connection and select module version **1.7.1**.
5. Configure the app's IP address and TCP port as described below.

A packaged module does not need developer mode. Companion keeps installed versions separately; importing a version that is already installed may report that it already exists. Select the installed version on the connection instead of importing it again.

Existing buttons keep their saved action settings and design. To use the revised stock button labels and feedback styles, drag fresh presets onto the desired buttons. Their underlying action, feedback, and preset IDs remain compatible.

## Configure the app and connection

1. Start **Advanced Speaker Timer Pro**.
2. In the app's network settings, enable **network control**. It is off by default.
3. Choose a reachable network interface and note the TCP port. The default is **18765**.
4. In the Companion connection, use `127.0.0.1` when both applications run on the same Mac. Otherwise, use the timer Mac's IP address on the shared network.
5. Set the same TCP port in Companion and save. The connection should become **OK** after receiving current timer status.

Use the matching app version **1.7.1** for Send Draft, correct clock-target time adjustments, and accurate clock-target remaining values. The module archive contains no macOS app. Older apps retain their existing controls where supported; Send Draft reports an update-needed warning if the app lacks that command.

## Try the stock buttons

- **Timer A / Timer B:** Start/Pause, Reset, live timer display, and ±1 minute.
- **Messages:** Send Draft and Clear Message are separate controls. Recall a message preset to load a draft, then send it. Send Draft can replace a message already on screen; Clear keeps the draft.
- **Output:** the output-window toggle and timer-layer toggle are separate. Hiding the timer leaves the background and messages available.
- **Output layouts:** choose Single Timer, Dual Timers, Clock Only, or Clock and Timer.
- **Rotary controls:** turn to select a preset and press to load it.

For your first test, use a spare Companion page and a timer session that is not presenting to an audience.

## Troubleshooting

- **Connection unavailable:** confirm network control is enabled, the IP/interface is reachable, and both ports match. Allow the connection through the Mac's firewall if required.
- **No revised presets:** verify the connection uses module version 1.7.1. Previously placed buttons do not automatically receive new designs.
- **Send Draft warns about the app version:** update the app to 1.7.1; the older Toggle Live Message action remains available.
- **A timer button is gray:** the module is disconnected or has not received recent timer status. It will recover automatically when current data returns.
- **Countdown to Time ±buttons have no effect:** use the updated app 1.7.1. Count Up elapsed timers intentionally ignore these adjustments.

From a source checkout, `node test-connection.js [host] [port]` requests status once and exits without changing any timer.
