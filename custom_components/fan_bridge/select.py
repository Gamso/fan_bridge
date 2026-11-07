"""The merged stop timer, always offered as a list of presets."""
from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import TIMER_PRESETS_MIN
from .entity import FanBridgeEntity
from .group import ROLE_TIMER, FanGroup


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback) -> None:
    """Add the merged timer when one is configured."""
    group: FanGroup = entry.runtime_data
    if group.pair(ROLE_TIMER):
        async_add_entities([FanBridgeTimer(group)])


def _label(minutes: float) -> str:
    """Option label of a duration in minutes: "off", "15 min", "2 h"."""
    if minutes == 0:
        return "off"
    if minutes < 60 or minutes % 60:
        return f"{minutes:g} min"
    return f"{minutes // 60:g} h"


class FanBridgeTimer(FanBridgeEntity, SelectEntity):
    """A select over the timer in charge.

    A timer that is a free-form number of minutes is offered as presets (plus
    its current value when it is none of them); one that is already a select
    keeps its own options.
    """

    def __init__(self, group: FanGroup) -> None:
        super().__init__(group, "select", ROLE_TIMER, "timer")

    @property
    def _is_number(self) -> bool:
        entity_id = self._group.active_id(ROLE_TIMER) or ""
        return entity_id.startswith("number.")

    @property
    def _current_minutes(self) -> float | None:
        source = self._source
        if source is None:
            return None
        try:
            return float(source.state)
        except ValueError:
            return None

    @property
    def options(self) -> list[str]:
        if not self._is_number:
            source = self._source
            return list(source.attributes.get("options", [])) if source else []
        minutes = sorted({*TIMER_PRESETS_MIN, *([self._current_minutes] if self._current_minutes is not None else [])})
        return [_label(m) for m in minutes]

    @property
    def current_option(self) -> str | None:
        source = self._source
        if source is None or source.state in ("unavailable", "unknown"):
            return None
        if self._is_number:
            minutes = self._current_minutes
            return None if minutes is None else _label(minutes)
        return source.state

    async def async_select_option(self, option: str) -> None:
        if not self._is_number:
            await self._call("select", "select_option", {"option": option})
            return
        for minutes in sorted({*TIMER_PRESETS_MIN, *([self._current_minutes] if self._current_minutes is not None else [])}):
            if _label(minutes) == option:
                await self._call("number", "set_value", {"value": minutes})
                return
