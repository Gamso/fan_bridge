"""The merged beep switch."""
from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .entity import FanBridgeEntity
from .group import ROLE_SOUND, FanGroup


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback) -> None:
    """Add the merged beep switch when one is configured."""
    group: FanGroup = entry.runtime_data
    if group.pair(ROLE_SOUND):
        async_add_entities([FanBridgeSound(group)])


class FanBridgeSound(FanBridgeEntity, SwitchEntity):
    """A switch that mirrors the beep switch in charge."""

    def __init__(self, group: FanGroup) -> None:
        super().__init__(group, "switch", ROLE_SOUND, "sound")

    @property
    def is_on(self) -> bool | None:
        source = self._source
        if source is None or source.state in ("unavailable", "unknown"):
            return None
        return source.state == "on"

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self._call("switch", "turn_on")

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._call("switch", "turn_off")
