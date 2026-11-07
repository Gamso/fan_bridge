# Changelog

## 1.0.0

First release of **FanBridge**: a Home Assistant integration for smart ceiling fans, with a dashboard card bundled.

### Added
- **Main and backup fans**: merges a main and a backup entity for each role (fan, light, stop timer, beep) into one `fan`, `light`, `select` and `switch` entity set, set up from the UI (config flow and options dialog). See [Main and backup fans](docs/en/fans.md).
- **Speed percentages**: per-fan tables for fans whose reported steps do not match their real speeds (for example 100 steps for 6 speeds).
- **Remote buttons**: map MQTT topics (Zigbee2MQTT) or action/event entities to 15 actions from the options dialog. See [Remotes](docs/en/remotes.md).
- **Reload the main integration** (opt-in): while the backup fan is in charge, reload the config entry that provides the main fan, with a growing delay, optionally gated by a ping or device tracker entity. See [Main and backup fans](docs/en/fans.md#reloading-the-main-integration).
- **Dashboard card** (`custom:fan-bridge-card`): dark glass design with a 270° speed dial, a summer/winter direction row, and chips for the preset, oscillation, light, timer and beep, with a badge while the backup is in charge. The accent follows `--fan-bridge-card-accent` (default `#2fd1a0`). It also works on its own, with any `fan` entity.
- The card editor is minimal: the fan, the name and a few display options. The rest is set in the integration, or in YAML for a fan used without it.
- Cache busting: the card is loaded as `?v=<version>-<hash>`, so an update never serves a stale bundle.
- Documentation in English and French (`docs/`).
