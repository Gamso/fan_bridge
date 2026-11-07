# Entities and services

[← Documentation](../../README.md#documentation) · [Français](../fr/reference.md)

Entity ids do not depend on the language of your Home Assistant. They are given when an entity is first created and built from the name you gave the fan (`Living room` → `living_room`); an id you renamed is kept.

Each fan is a **device**, with one entity per role. A role left empty in the options has no entity.

| Entity | Exists when |
| --- | --- |
| `fan.<name>` | Always |
| `light.<name>_light` | A light is set |
| `select.<name>_timer` | A timer is set |
| `switch.<name>_sound` | A beep switch is set |

## `fan.<name>`

The fan in charge, see [Main and backup fans](fans.md).

- **Features:** whatever the fan in charge supports (speed, direction, presets, oscillation, turn on/off).
- **Speed:** the steps are even whatever the fan in charge, see [Speed percentages](fans.md#speed-percentages).
- **Attributes:** `source_entity`, the entity in charge, and `using_backup`, `true` while it is the backup one.

## `light.<name>_light`

The light in charge: on/off, brightness and colour temperature when it supports them. Same attributes.

## `select.<name>_timer`

The stop timer of the fan in charge. For a `number` entity the options are **off, 15 min, 30 min, 1 h, 2 h, 4 h and 8 h** (a value outside them is shown as is, as `45 min`); for a `select` entity they are its own options. Same attributes.

## `switch.<name>_sound`

The beep switch in charge. Same attributes.

## Remote buttons

Remote buttons are not entities: they are stored in the options and listed in **Configure → Remotes**, see [Remotes](remotes.md). Each pressed button calls the services of the merged entities (`fan.toggle`, `fan.increase_speed`, `fan.set_percentage`, `fan.set_direction`, `fan.oscillate`, `fan.set_preset_mode`, `light.toggle`, `switch.toggle`, ...).

## The card's bundle

The integration serves the card at `/fan_bridge/fan-bridge-card.js?v=<version>-<hash>` and loads it in every dashboard. The `?v=` value is the version of the integration and the first 8 characters of the file's SHA-256, so the browser fetches the new bundle as soon as either changes: **no cache to clear after an update**, only a page reload.
