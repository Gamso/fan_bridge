# Changelog

## 1.1.0

### 🖥️ Dashboard card

* **Brightness slider**: the button next to the light chip now opens a brightness slider, next to the colour temperature one when the light has it (#40).
* **Draggable speed dial**: slide along the arc, the dial follows your finger and the speed is sent once, when you let go. The speed buttons are larger (#38).
* The card editor and the card picker only offer FanBridge fans, and the card picker links the card's documentation (#34, #26).
* The stop timer's "off" option is translated (#36).
* Accent text stays readable on light themes (#32).
* The card reports its real height, so masonry dashboards no longer overlap it (#38).

### 🔁 Main and backup fans

* **Renamed entities are followed**: rename a main, backup, presence or remote entity and FanBridge writes the new id into its options, nothing to set again (#14).
* **Logbook**: an entry when the backup takes over or hands back, from the new `fan_bridge_source_changed` event, which can also trigger automations (#16).
* **Diagnostics**: download them from the integration's page to see which entities make up a fan and which one is in charge (#16).

### 🐛 Fixes

* The card showed "… is not a FanBridge fan" while the fan was unavailable; it now shows it as unavailable (#22).
* The merged light only offers what it relays (colour temperature or brightness), instead of a colour picker that did nothing (#10).
* A FanBridge entity can no longer be picked as the source of a fan, which made the service calls loop (#12).

### 📦 Installation

* HACS now installs the `fan_bridge.zip` attached to each release, with the card included. Update from HACS as usual, nothing else to do (#42).
* Releases are published from a version tag by a workflow (#18).

### 🛠️ Development

* CI runs on `main` (#6); the card bundle is no longer committed, so pull requests stop conflicting on it (#42, #24).
* Housekeeping: devcontainer data git-ignored (#8), `build.bat` fixed (#20), unused translations removed (#30), the card version checked against the manifest (#28).

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
