"""Diagnostics: what a fan is made of and which entity is in charge."""
from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant

from . import FanBridgeConfigEntry
from .group import ROLE_FAN, ROLE_LIGHT, ROLE_SOUND, ROLE_TIMER, merged_config


def _state(hass: HomeAssistant, entity_id: str) -> dict[str, Any] | None:
    state = hass.states.get(entity_id)
    if state is None:
        return None
    return {"state": state.state, "attributes": dict(state.attributes)}


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: FanBridgeConfigEntry) -> dict[str, Any]:
    """Return the settings, and for each role its entities and which one is in charge."""
    group = entry.runtime_data
    roles: dict[str, Any] = {}
    for role in (ROLE_FAN, ROLE_LIGHT, ROLE_TIMER, ROLE_SOUND):
        pair = group.pair(role)
        if not pair:
            continue
        roles[role] = {
            "main": pair.primary,
            "backup": pair.backup,
            "in_charge": group.active_id(role),
            "using_backup": group.using_backup(role),
            "available": group.available(role),
            "states": {entity_id: _state(hass, entity_id) for entity_id in pair.ids},
        }
    return {
        "config": merged_config(entry),
        "speed_count": group.speed_count,
        "speed_table": group.speed_table,
        "roles": roles,
    }
