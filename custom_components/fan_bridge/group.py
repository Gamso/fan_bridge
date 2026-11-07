"""The entities of one fan: a main one, an optional backup, per role."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, State

from .const import (
    CONF_FALLBACK_FAN,
    CONF_FALLBACK_LIGHT,
    CONF_FALLBACK_SOUND,
    CONF_FALLBACK_SPEEDS,
    CONF_FALLBACK_TIMER,
    CONF_FAN,
    CONF_LIGHT,
    CONF_NAME,
    CONF_SOUND,
    CONF_SPEEDS,
    CONF_TIMER,
    UNAVAILABLE_STATES,
)
from .helpers import parse_speed_percentages, speed_count

ROLE_FAN = "fan"
ROLE_LIGHT = "light"
ROLE_TIMER = "timer"
ROLE_SOUND = "sound"

_ROLE_KEYS = {
    ROLE_FAN: (CONF_FAN, CONF_FALLBACK_FAN),
    ROLE_LIGHT: (CONF_LIGHT, CONF_FALLBACK_LIGHT),
    ROLE_TIMER: (CONF_TIMER, CONF_FALLBACK_TIMER),
    ROLE_SOUND: (CONF_SOUND, CONF_FALLBACK_SOUND),
}


def merged_config(entry: ConfigEntry) -> dict[str, Any]:
    """Return the entry's settings, the options taking precedence."""
    return {**entry.data, **entry.options}


@dataclass(frozen=True)
class Pair:
    """The main entity of a role and its optional backup."""

    primary: str | None
    backup: str | None

    @property
    def ids(self) -> list[str]:
        return [entity_id for entity_id in (self.primary, self.backup) if entity_id]

    def __bool__(self) -> bool:
        return bool(self.primary or self.backup)


def _usable(state: State | None) -> bool:
    return state is not None and state.state not in UNAVAILABLE_STATES


class FanGroup:
    """Resolve, for each role, which of the two entities is in charge."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        config = merged_config(entry)
        self.name: str = config[CONF_NAME]
        self._pairs = {
            role: Pair(config.get(main) or None, config.get(backup) or None)
            for role, (main, backup) in _ROLE_KEYS.items()
        }
        self._speeds = parse_speed_percentages(config.get(CONF_SPEEDS))
        self._fallback_speeds = parse_speed_percentages(config.get(CONF_FALLBACK_SPEEDS))

    def pair(self, role: str) -> Pair:
        return self._pairs[role]

    def active_id(self, role: str) -> str | None:
        """Main entity while it is usable, else the backup if it is, else the main."""
        pair = self._pairs[role]
        if pair.primary and _usable(self.hass.states.get(pair.primary)):
            return pair.primary
        if pair.backup and _usable(self.hass.states.get(pair.backup)):
            return pair.backup
        return pair.primary or pair.backup

    def active_state(self, role: str) -> State | None:
        entity_id = self.active_id(role)
        return self.hass.states.get(entity_id) if entity_id else None

    def using_backup(self, role: str) -> bool:
        pair = self._pairs[role]
        return bool(pair.backup) and self.active_id(role) == pair.backup and pair.primary != pair.backup

    def available(self, role: str) -> bool:
        return any(_usable(self.hass.states.get(entity_id)) for entity_id in self._pairs[role].ids)

    # ── Fan speeds ──────────────────────────────────────────────────────────

    @property
    def speed_table(self) -> list[int] | None:
        """The percentages of each speed of the fan in charge, if configured."""
        return self._fallback_speeds if self.using_backup(ROLE_FAN) else self._speeds

    @property
    def speed_count(self) -> int:
        table = self.speed_table
        if table:
            return len(table)
        state = self.active_state(ROLE_FAN)
        return speed_count(state.attributes.get("percentage_step") if state else None)
