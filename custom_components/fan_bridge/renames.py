"""Follow the source entities when the user renames them.

The entry stores entity ids. When one of them is renamed in the entity
registry, the entry is rewritten with the new id (which reloads it), instead
of the role silently losing its entity.
"""
from __future__ import annotations

from collections.abc import Callable, Mapping
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er

from .const import (
    CONF_FALLBACK_FAN,
    CONF_FALLBACK_LIGHT,
    CONF_FALLBACK_SOUND,
    CONF_FALLBACK_TIMER,
    CONF_FAN,
    CONF_LIGHT,
    CONF_PRESENCE,
    CONF_REMOTE_ENTITY,
    CONF_REMOTES,
    CONF_SOUND,
    CONF_TIMER,
)

# Entry keys that hold one entity id.
ENTITY_KEYS = (
    CONF_FAN,
    CONF_FALLBACK_FAN,
    CONF_LIGHT,
    CONF_FALLBACK_LIGHT,
    CONF_TIMER,
    CONF_FALLBACK_TIMER,
    CONF_SOUND,
    CONF_FALLBACK_SOUND,
    CONF_PRESENCE,
)


def rename_entity(config: Mapping[str, Any], old: str, new: str) -> dict[str, Any] | None:
    """Return a copy of config with old replaced by new, None if old is not used."""
    result = dict(config)
    changed = False
    for key in ENTITY_KEYS:
        if result.get(key) == old:
            result[key] = new
            changed = True
    remotes = result.get(CONF_REMOTES)
    if isinstance(remotes, list):
        renamed = []
        for item in remotes:
            if isinstance(item, dict) and item.get(CONF_REMOTE_ENTITY) == old:
                item = {**item, CONF_REMOTE_ENTITY: new}
                changed = True
            renamed.append(item)
        result[CONF_REMOTES] = renamed
    return result if changed else None


@callback
def async_track_renames(hass: HomeAssistant, entry: ConfigEntry) -> Callable[[], None]:
    """Rewrite the entry when one of its entities is renamed; return the unsubscribe."""

    @callback
    def _is_rename(event_data: Mapping[str, Any]) -> bool:
        return (
            event_data["action"] == "update"
            and "old_entity_id" in event_data
            and event_data["entity_id"] != event_data["old_entity_id"]
        )

    @callback
    def _renamed(event: Event[er.EventEntityRegistryUpdatedData]) -> None:
        old, new = event.data["old_entity_id"], event.data["entity_id"]  # type: ignore[typeddict-item]
        data = rename_entity(entry.data, old, new)
        options = rename_entity(entry.options, old, new)
        if data is None and options is None:
            return
        # The entry's unique id is its main fan: keep it in step.
        unique_id = new if entry.unique_id == old else entry.unique_id
        hass.config_entries.async_update_entry(
            entry,
            data=data if data is not None else entry.data,
            options=options if options is not None else entry.options,
            unique_id=unique_id,
        )

    return hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, _renamed, event_filter=_is_rename)
