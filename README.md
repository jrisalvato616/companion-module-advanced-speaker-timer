# Advanced Speaker Timer — Companion module

Control Advanced Speaker Timer Pro from Bitfocus Companion over a local TCP connection.

## Install

Download the `.tgz` module package from this repository's GitHub Releases. In Companion 4 or 5, open **Modules → Import module package**, choose the file, then select version **1.7.1** for your Advanced Speaker Timer connection. You do not need developer mode. Export your Companion configuration before updating an existing setup; existing buttons retain their saved designs.

See [installation instructions](INSTALL_COMPANION_V4.md) for the full workflow.

## App compatibility

Use the matching **Advanced Speaker Timer Pro 1.7.1** app for all features. **Send Draft**, clock-target time adjustments, and accurate clock-target remaining-time variables require that updated app. The Companion package does not include the macOS app.

With older app versions, existing Start/Pause/Reset, preset recall, Toggle Live Message, Set Message, and display controls remain available where supported by that app. Send Draft checks the app's `showMessage` capability and logs an update-needed warning instead of sending an unsupported command. Existing Start/Pause buttons use the legacy explicit Start/Pause commands when the app lacks the newer toggle capability.

## Connect

1. In Advanced Speaker Timer, open the network settings and enable **network control**. It is off by default.
2. In Companion, add the **Advanced Speaker Timer Pro** connection.
3. Enter the Mac's IP address, or `127.0.0.1` when Companion runs on the same Mac.
4. Use TCP port **18765**, unless you changed it in the app. Both ends must use the same port and the selected network interface must be reachable.

This module uses the app's local TCP server. Internet sharing is a separate service.

## Choose ready-made buttons

- **Timer A / Timer B:** live display, Start/Pause, Reset, and ±1 minute. Reset turns blue when ready; Start/Pause is green while running and yellow while paused. Live time turns amber during warning and red during overtime or after finishing.
- **Timer A presets / Timer B presets:** your app's presets, grouped by destination. The same preset appears once for each timer because those buttons load different timers. Loading a timer preset resets it; it does not start it.
- **Timer status:** elapsed-time monitors. These show time accumulated, which differs from a countdown's live display. In Count Up mode the two displays naturally match.
- **Output layouts:** Single Timer, Dual Timers, Clock Only, or Clock and Timer. These are screen arrangements, separate from each timer's Countdown, Count Up, or Countdown to Time type.
- **Output:** enabling output opens the presentation window; disabling it closes that window. Timer visibility hides only the timer, leaving the background and messages available.
- **Messages:** Send Draft and Clear Message are separate, predictable controls. Send Draft also replaces an already-live message. Clear Message hides it and keeps the draft. The older send/hide toggle is retained under **More message controls**.
- **Message presets:** load a draft without sending it. Use Send Draft afterward, or combine recall then send in one button.
- **Rotary controls:** turn to highlight a preset and press to load it. Timer A and Timer B share the highlighted timer preset list; loading still targets the timer selected in the action. Reordering presets preserves the highlighted preset's identity.

All stock buttons turn gray when the module lacks recent app status. A disconnected or stale timer is shown as unavailable rather than displaying an old time as if it were live.

Companion copies a preset when you drag it onto a button. Existing buttons retain their saved design; drag a fresh preset to get the new labels/styles. Existing action, feedback, and preset IDs are preserved.

## Actions and feedback

Explicit Start, Pause, Reset, Show/Hide Output, Show/Hide Timer and custom ±seconds actions remain available for macros. Time adjustments change a countdown duration or clock deadline; Count Up elapsed timers are not adjusted. Custom adjustments use whole seconds, up to ±3600 per action.

**Set Message** accepts Companion variables and multiline text. Enable **Send to screen immediately** to send it in one action. When a message is already live, setting its text updates that live message even if the checkbox is off; use a message preset to stage a separate draft.

Feedbacks report running, paused, warning, overtime, ready/finished state, local output enabled, timer-layer visibility, live message, selected output layout, and connection availability. Visibility feedback reflects the requested timer layer; it does not imply that a presentation window or remote viewer is open. A preset's rotary highlight is not a claim that the preset is currently loaded into a timer.

The app's own warning/overtime flags take precedence. Older apps use conservative fallbacks for the status fields they provide.

## Variables

Use your connection's label in variable references, for example `$(timer:timer_a_display_text)` for a connection named `timer`.

- `timer_a_display_text` / `timer_b_display_text`: exactly the app's timer text, including count-up and `+` overtime.
- `timer_a_mode` / `timer_b_mode`: timer type.
- `timer_a_remaining_time` / `timer_b_remaining_time`: signed seconds to the deadline; blank for Count Up. Accurate ready/paused clock-target values require the updated app.
- `timer_a_current_time_formatted` / `timer_b_current_time_formatted`: elapsed time.
- `live_message`: draft text; `displayed_message`: text currently live when reported by the app.
- `connection_status`: connecting, waiting, connected, stale, or disconnected.

The historical `*_remaining_time_formatted` IDs remain aliases for the app display text so existing buttons retain their behavior. Use `*_display_text` for new buttons. Times include hours when needed.

## Local development and checks

From this module directory:

```bash
npm test
npm run typecheck
npm run build
npm run check
```

Tests exercise every preset's references, action payloads, feedback semantics, variable values, reconnects, stale data, UTF-8 framing and rotary selection. When run inside the app repository, an additional test checks action names against the Swift command handlers; that integration check is skipped in a standalone module checkout. The app repository also contains Swift tests for the corresponding behavior.

A read-only connection check is available while the app's network server is enabled:

```bash
node test-connection.js
# Optional: node test-connection.js 192.168.1.50 18765
```

It requests status once and exits. It never starts a timer or changes the app. A timeout usually means the app is not listening on the configured address/port, network control is off, or a firewall blocks the connection.

`npm run package` builds a local Companion package. Building or packaging does not install it into a running Companion instance or publish a release.

## License

MIT — see LICENSE.
