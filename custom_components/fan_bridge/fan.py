"""The merged fan: the main fan while it works, the backup one otherwise."""
from __future__ import annotations

from typing import Any

from homeassistant.components.fan import FanEntity, FanEntityFeature
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .entity import FanBridgeEntity
from .group import ROLE_FAN, FanGroup
from .helpers import percentage_to_speed, speed_to_command_percentage


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback) -> None:
    """Add the merged fan."""
    async_add_entities([FanBridge(entry.runtime_data)])


class FanBridge(FanBridgeEntity, FanEntity):
    """A fan that forwards everything to the fan in charge.

    Speeds are numbered 1..N, N coming from the speed table of the fan in
    charge (or its percentage_step). The percentages of this entity are the
    even ones (16, 33, 50, 66, 83, 100 on six speeds); the ones sent to the
    real fan are the ones of its own table, so a fan that numbers its steps
    differently still gets the right speed.
    """

    def __init__(self, group: FanGroup) -> None:
        super().__init__(group, "fan", ROLE_FAN, None)

    @property
    def _attrs(self) -> dict[str, Any]:
        return self._source.attributes if self._source else {}

    @property
    def supported_features(self) -> FanEntityFeature:
        features = FanEntityFeature(int(self._attrs.get("supported_features") or 0))
        return features | FanEntityFeature.TURN_ON | FanEntityFeature.TURN_OFF

    @property
    def is_on(self) -> bool | None:
        source = self._source
        if source is None or source.state in ("unavailable", "unknown"):
            return None
        return source.state == "on"

    @property
    def speed_count(self) -> int:
        return self._group.speed_count

    @property
    def percentage(self) -> int | None:
        if not self.is_on:
            return 0 if self.is_on is False else None
        raw = self._attrs.get("percentage")
        if raw is None:
            return None
        speed = percentage_to_speed(raw, self.speed_count, self._group.speed_table)
        return speed_to_command_percentage(speed, self.speed_count)

    @property
    def current_direction(self) -> str | None:
        return self._attrs.get("direction")

    @property
    def oscillating(self) -> bool | None:
        return self._attrs.get("oscillating")

    @property
    def preset_modes(self) -> list[str] | None:
        return self._attrs.get("preset_modes")

    @property
    def preset_mode(self) -> str | None:
        return self._attrs.get("preset_mode")

    def _command_percentage(self, percentage: int) -> int:
        """Percentage to send to the fan in charge for one of our percentages."""
        speed = percentage_to_speed(percentage, self.speed_count)
        return speed_to_command_percentage(speed, self.speed_count, self._group.speed_table)

    async def async_turn_on(self, percentage: int | None = None, preset_mode: str | None = None, **kwargs: Any) -> None:
        data: dict[str, Any] = {}
        if percentage is not None:
            data["percentage"] = self._command_percentage(percentage)
        if preset_mode is not None:
            data["preset_mode"] = preset_mode
        await self._call("fan", "turn_on", data)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._call("fan", "turn_off")

    async def async_set_percentage(self, percentage: int) -> None:
        if percentage == 0:
            await self.async_turn_off()
            return
        await self._call("fan", "set_percentage", {"percentage": self._command_percentage(percentage)})

    async def async_set_preset_mode(self, preset_mode: str) -> None:
        await self._call("fan", "set_preset_mode", {"preset_mode": preset_mode})

    async def async_oscillate(self, oscillating: bool) -> None:
        await self._call("fan", "oscillate", {"oscillating": oscillating})

    async def async_set_direction(self, direction: str) -> None:
        await self._call("fan", "set_direction", {"direction": direction})
