# DevContainer Development Environment

This devcontainer lets you develop and test the FanBridge Card against a real Home Assistant instance running in Docker, with all fan entities pre-configured as simulation helpers.

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [Docker](https://www.docker.com/get-started)
- VS Code extension: [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- Node.js 14+ (on your **host** machine)

## Quick Start

1. **Build the card on your host** (required before opening the container):

   ```bash
   npm install
   npm run build
   ```

   Verify that `dist/fan-bridge-card.js` exists.

2. **Open in container**:
   - Press `F1` → **"Dev Containers: Reopen in Container"**
   - Wait for setup (~5 minutes first time, ~30 seconds subsequently)

3. **Wait for Home Assistant**:
   - Look for `Home Assistant initialized in XXs` in the terminal output
   - First time: 1–2 minutes after "Setup complete!"

4. **Access Home Assistant**:
   - Open: http://localhost:8123
   - Create an account and complete the initial setup wizard

5. **Enable Advanced Mode** (required to see template entities):
   - Profile (bottom-left) → enable **"Advanced Mode"**

6. **Open the "Overview" dashboard** — it's the main dashboard (YAML mode, loaded from `ui-lovelace.yaml`), so the card appears there automatically.

## How It Works

| Path (host) | Mounted to (container) | Purpose |
|---|---|---|
| `.devcontainer/config/` | `/config/` | HA configuration (entities, Lovelace) |
| `dist/` | `/config/www/fan_bridge/` | Built card JS served by HA |

The `dist/` folder is bind-mounted, so rebuilding on the host is immediately reflected in HA after a browser hard-refresh (`Ctrl+Shift+R`).

## Simulated Entities

The devcontainer creates the following entities to simulate a real ceiling fan:

### Template entities (what the card uses)

| Entity ID | Role |
|---|---|
| `fan.ceiling_fan_with_light` | Fan on/off + speed (0–100 %) + direction + preset mode (`normal`/`sleep`/`nature`) |
| `light.ceiling_fan_with_light` | Ceiling light on/off + color temperature |
| `number.ceiling_fan_with_light_minuteur` | Stop timer (0–480 min) |
| `switch.ceiling_fan_with_light_son` | Audible beep on action |

### Backing helpers (mutable state)

| Helper | Role |
|---|---|
| `input_number.wc_fan_speed_backing` | Fan speed (0–100 %) |
| `input_select.wc_fan_direction_backing` | Fan rotation direction (`forward` / `reverse`) |
| `input_select.wc_fan_preset_backing` | Preset mode (`normal` / `sleep` / `nature`) |
| `input_boolean.wc_light_backing` | Light on/off state |
| `input_number.wc_light_kelvin_backing` | Light color temperature (Kelvin) |
| `input_number.wc_timer_backing` | Timer value (minutes) |
| `input_boolean.wc_sound_backing` | Sound beep on/off |

You can toggle these helpers manually in **Settings → Devices & Services → Helpers** (search `wc_`) to simulate states independently of the card.

## Development Workflow

### Making changes

1. Edit files in `src/`
2. Rebuild on your host: `npm run build`
3. Hard-refresh the browser: `Ctrl+Shift+R`

### Watch mode (auto-rebuild on save)

```bash
npm run watch
```

Then just hard-refresh the browser after each save.

### Home Assistant logs (inside the container)

```bash
tail -f /config/home-assistant.log
```

### Browser console

Press `F12` to see JavaScript errors and Lit component warnings.

## Stopping

- Close VS Code, or
- Press `F1` → **"Dev Containers: Reopen Folder Locally"**

The container stops automatically.

## Support

- [Dev Containers documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Home Assistant Lovelace custom cards](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/)
- [Lit element docs](https://lit.dev/docs/)
