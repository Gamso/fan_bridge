"""Describe the FanBridge events in the logbook."""
from __future__ import annotations

from collections.abc import Callable
from typing import Any

from homeassistant.components.logbook import (
    LOGBOOK_ENTRY_ENTITY_ID,
    LOGBOOK_ENTRY_MESSAGE,
    LOGBOOK_ENTRY_NAME,
)
from homeassistant.core import Event, HomeAssistant, callback

from .const import DOMAIN, EVENT_SOURCE_CHANGED


@callback
def async_describe_events(
    hass: HomeAssistant,
    async_describe_event: Callable[[str, str, Callable[[Event], dict[str, Any]]], None],
) -> None:
    """Describe the handover between a main entity and its backup."""

    @callback
    def describe(event: Event) -> dict[str, Any]:
        data = event.data
        entity_id = data.get("entity_id")
        state = hass.states.get(entity_id) if entity_id else None
        source = data.get("source_entity")
        message = f"switched to its backup {source}" if data.get("using_backup") else f"is back on its main entity {source}"
        return {
            LOGBOOK_ENTRY_NAME: state.name if state else entity_id or DOMAIN,
            LOGBOOK_ENTRY_MESSAGE: message,
            LOGBOOK_ENTRY_ENTITY_ID: entity_id,
        }

    async_describe_event(DOMAIN, EVENT_SOURCE_CHANGED, describe)
