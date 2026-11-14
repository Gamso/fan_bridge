# Changelog

## Unreleased

### Fixed
- The card no longer calls an unavailable FanBridge fan "not a FanBridge fan": it recognises the fan from the entity registry, since Home Assistant drops the `using_backup` attribute of an unavailable entity.
- The merged light only offers the colour modes it relays (colour temperature, or brightness), instead of a colour picker that did nothing.
- A FanBridge entity can no longer be picked as a source, which made the service calls loop.
- CI runs on pushes to `main`.

### Added
- Renamed source entities are followed: the entry is rewritten with the new entity id.
- Diagnostics, and a logbook entry (event `fan_bridge_source_changed`) when the backup of a role takes over or hands back.
- Card: a brightness slider behind the light chip, and the speed dial can be dragged.
- Release workflow: pushing a `v*` tag publishes a GitHub release with the CHANGELOG section of that version.

### Changed
- Card: the editor and the card picker only offer FanBridge fans; larger speed buttons; accent text readable on light themes; `getCardSize` matches the rendered height; the timer's "off" option is translated.
- The card is built straight into `custom_components/fan_bridge/www/`: the duplicate `dist/` bundle is gone.

## 1.0.0

First release of **FanBridge**: a Home Assistant integration for smart ceiling fans, with a dashboard card bundled.

### Added
- **Main and backup fans**: merges a main and a backup entity for each role (fan, light, stop timer, beep) into one `fan`, `light`, `select` and `switch` entity set, set up from the UI (config flow and options dialog). See [Main and backup fans](docs/en/fans.md).
- **Speed percentages**: per-fan tables for fans whose reported steps do not match their real speeds (for example 100 steps for 6 speeds).
- **Remote buttons**: map MQTT topics (Zigbee2MQTT) or action/event entities to 15 actions from the options dialog. See [Remotes](docs/en/remotes.md).
- **Reload the main integration** (opt-in): while the backup fan is in charge, reload the config entry that provides the main fan, with a growing delay, optionally gated by a ping or device tracker entity. See [Main and backup fans](docs/en/fans.md#reloading-the-main-integration).
- **Dashboard card** (`custom:fan-bridge-card`): dark glass design with a 270° speed dial, a summer/winter direction row, and chips for the preset, oscillation, light, timer and beep, with a badge while the backup is in charge. The accent follows `--fan-bridge-card-accent` (default `#2fd1a0`). It only works with a fan created by the integration.
- The card editor is minimal: the fan, the name and a few display options. Everything else is set in the integration, and the card finds the light, timer and beep of the fan's device by itself.
- Cache busting: the card is loaded as `?v=<version>-<hash>`, so an update never serves a stale bundle.
- Documentation in English and French (`docs/`).
