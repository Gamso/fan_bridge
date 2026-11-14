"""The merged light: the main light while it works, the backup one otherwise."""
from __future__ import annotations

from typing import Any

from homeassistant.components.light import (
    ATTR_BRIGHTNESS,
    ATTR_COLOR_TEMP_KELVIN,
    ColorMode,
    LightEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .entity import FanBridgeEntity
from .group import ROLE_LIGHT, FanGroup


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback) -> None:
    """Add the merged light when one is configured."""
    group: FanGroup = entry.runtime_data
    if group.pair(ROLE_LIGHT):
        async_add_entities([FanBridgeLight(group)])


def _modes(raw: Any) -> set[ColorMode]:
    """The one colour mode this light offers for the modes of its source.

    Only the brightness and the colour temperature are relayed, so a source
    with colours (hs, rgb...) is offered as what it can do of those two:
    colour temperature if it has it, brightness otherwise.
    """
    modes: set[ColorMode] = set()
    for mode in raw or ():
        try:
            modes.add(ColorMode(mode))
        except ValueError:
            continue
    if ColorMode.COLOR_TEMP in modes:
        return {ColorMode.COLOR_TEMP}
    if modes - {ColorMode.ONOFF, ColorMode.UNKNOWN}:
        return {ColorMode.BRIGHTNESS}
    return {ColorMode.ONOFF}


class FanBridgeLight(FanBridgeEntity, LightEntity):
    """A light that mirrors the light in charge, brightness and colour temperature included."""

    def __init__(self, group: FanGroup) -> None:
        super().__init__(group, "light", ROLE_LIGHT, "light")

    @property
    def _attrs(self) -> dict[str, Any]:
        return self._source.attributes if self._source else {}

    @property
    def is_on(self) -> bool | None:
        source = self._source
        if source is None or source.state in ("unavailable", "unknown"):
            return None
        return source.state == "on"

    @property
    def supported_color_modes(self) -> set[ColorMode]:
        return _modes(self._attrs.get("supported_color_modes"))

    @property
    def color_mode(self) -> ColorMode:
        (mode,) = self.supported_color_modes
        return mode

    @property
    def brightness(self) -> int | None:
        return self._attrs.get("brightness")

    @property
    def color_temp_kelvin(self) -> int | None:
        return self._attrs.get("color_temp_kelvin")

    @property
    def min_color_temp_kelvin(self) -> int:
        return int(self._attrs.get("min_color_temp_kelvin") or 2000)

    @property
    def max_color_temp_kelvin(self) -> int:
        return int(self._attrs.get("max_color_temp_kelvin") or 6500)

    async def async_turn_on(self, **kwargs: Any) -> None:
        data = {key: kwargs[key] for key in (ATTR_BRIGHTNESS, ATTR_COLOR_TEMP_KELVIN) if key in kwargs}
        await self._call("light", "turn_on", data)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._call("light", "turn_off")
