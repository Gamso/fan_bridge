# FanBridge

**English** · [Français](README.fr.md)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)

A Home Assistant integration for smart ceiling fans. It **merges a local and a cloud entity of the same fan** (for example Tuya Local and Tuya) into one set of entities, with the local one in charge and the cloud one as a backup, maps the **buttons of a remote** to actions, and ships a **dashboard card** to control it all.

<p align="center">
  <img src="docs/images/card/en/preview.png" alt="The FanBridge card" width="420">
</p>

## Features

| | |
| --- | --- |
| 🔁 **Main and backup fans** | For the fan, the light, the stop timer and the beep, a main entity is used while it is available and a backup one takes over otherwise, and gives control back as soon as the main one returns. → [Main and backup fans](docs/en/fans.md) |
| 🎚️ **Speed percentages** | Two integrations seldom agree on the speeds of a fan (6 steps against 100). Give the percentage of each speed for each of them, and the merged fan exposes even steps. → [Speed percentages](docs/en/fans.md#speed-percentages) |
| 🎛️ **Remotes** | Map the buttons of a Zigbee2MQTT remote (MQTT topic, action sensor or event entity) to 15 actions, instead of writing automations. → [Remotes](docs/en/remotes.md) |
| 🖥️ **Dashboard card** | Bundled with the integration, nothing to install: speed dial, summer/winter direction, preset, oscillation, light, timer and beep, with a badge while the backup is in charge. → [The card](docs/en/card.md) |
| ⚙️ **Set up from the UI** | A config flow and an options dialog, no YAML. → [Configuration](docs/en/configuration.md) |

## Requirements

- **Home Assistant 2026.2** or newer
- A `fan` entity (two, to use a backup)
- Optional: the **MQTT** integration for remotes read from MQTT topics (Zigbee2MQTT)

The card needs a browser that supports CSS `color-mix()` (all evergreen browsers and the current companion apps).

## Installation

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Gamso&repository=fan_bridge&category=integration)

Or by hand:

1. Open **HACS** in Home Assistant, then the three-dot menu → **Custom repositories**
2. Add `https://github.com/Gamso/fan_bridge` with the category **Integration**
3. Search for **FanBridge**, install it, and restart Home Assistant

The dashboard card comes with it: no Lovelace resource to add.

## Getting started

[![Open your Home Assistant instance and start setting up a new integration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=fan_bridge)

Or:

1. **Settings → Devices & Services → Add Integration → FanBridge**
2. Name the fan, pick the fan entity and, optionally, a backup fan
3. Add the **FanBridge** card to a dashboard (or `type: custom:fan-bridge-card`, `fan_entity: fan.<name>`)

Then open **Configure** to add the light, the timer, the beep, the speed percentages and the remote buttons, see [Configuration](docs/en/configuration.md).

## Documentation

| Page | What it covers |
| --- | --- |
| [Configuration](docs/en/configuration.md) | Adding a fan, the options dialog and the entities |
| [Main and backup fans](docs/en/fans.md) | Which entity is in charge, speed percentages, the merged entities |
| [Remotes](docs/en/remotes.md) | Mapping remote buttons to actions |
| [The card](docs/en/card.md) | What the card shows, its options and the entities it controls |
| [Entities and services](docs/en/reference.md) | Every entity, attribute and service, the card's bundle |
| [Development](docs/en/development.md) | Repository layout, tests, building the card, devcontainer |

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
