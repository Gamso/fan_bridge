"""Reload the main fan's integration while the backup is in charge.

Some local integrations (Tuya Local, for one) fail their setup when the
device is off at startup, and do not recover when it comes back until they
are reloaded by hand. While the backup fan is in charge, this periodically
reloads the config entry that provides the main fan, with a growing delay,
until the main fan is usable again.
"""
from __future__ import annotations

import logging
from collections.abc import Callable

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import CALLBACK_TYPE, Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .const import CONF_PRESENCE, DOMAIN, RELOAD_DELAYS
from .group import merged_config
from .group import ROLE_FAN, FanGroup

_LOGGER = logging.getLogger(__name__)

_PRESENT = frozenset({"on", "home"})
_ABSENT = frozenset({"off", "not_home"})

# Entries in one of these states are already being set up or torn down.
_BUSY = (ConfigEntryState.SETUP_IN_PROGRESS, ConfigEntryState.UNLOAD_IN_PROGRESS)


class MainRecovery:
    """Retry the main fan's integration while the backup fan is in charge."""

    def __init__(
        self,
        hass: HomeAssistant,
        group: FanGroup,
        delays: tuple[int, ...] = RELOAD_DELAYS,
    ) -> None:
        self._hass = hass
        self._group = group
        self._delays = delays
        self._attempt = 0
        self._cancel_timer: CALLBACK_TYPE | None = None
        self._presence: str | None = merged_config(group.entry).get(CONF_PRESENCE) or None

    @callback
    def async_start(self) -> Callable[[], None]:
        """Start watching; return the function that stops it."""
        main = self._group.pair(ROLE_FAN).primary
        unsubscribe = None
        if main:
            watched = {*self._group.pair(ROLE_FAN).ids, *([self._presence] if self._presence else [])}
            unsubscribe = async_track_state_change_event(self._hass, sorted(watched), self._changed)
            self._evaluate()

        @callback
        def stop() -> None:
            if unsubscribe:
                unsubscribe()
            self._stop_timer()

        return stop

    @callback
    def _changed(self, event: Event[EventStateChangedData]) -> None:
        new = event.data["new_state"]
        if event.data["entity_id"] == self._presence and new is not None and new.state in _PRESENT:
            # The device just showed up on the network: retry right away.
            if self._group.using_backup(ROLE_FAN):
                self._stop_timer()
                self._hass.async_create_task(self._retry(None))
            return
        self._evaluate()

    def _reachable(self) -> bool:
        """False only when the presence entity says the device is not there."""
        if not self._presence:
            return True
        state = self._hass.states.get(self._presence)
        return state is None or state.state not in _ABSENT

    @callback
    def _evaluate(self) -> None:
        """Arm the retries while the backup is in charge, disarm them otherwise."""
        if self._group.using_backup(ROLE_FAN):
            if self._cancel_timer is None:
                self._schedule()
        else:
            self._attempt = 0
            self._stop_timer()

    @callback
    def _stop_timer(self) -> None:
        if self._cancel_timer:
            self._cancel_timer()
            self._cancel_timer = None

    @callback
    def _schedule(self) -> None:
        delay = self._delays[min(self._attempt, len(self._delays) - 1)]
        self._cancel_timer = async_call_later(self._hass, delay, self._retry)

    async def _retry(self, _now) -> None:
        self._cancel_timer = None
        if not self._group.using_backup(ROLE_FAN):
            self._attempt = 0
            return
        if self._reachable():
            await self._reload_main()
            self._attempt += 1
        self._evaluate()

    async def _reload_main(self) -> None:
        main = self._group.pair(ROLE_FAN).primary
        registry_entry = er.async_get(self._hass).async_get(main) if main else None
        if registry_entry is None or registry_entry.config_entry_id is None:
            return  # YAML or template entity: nothing to reload
        entry = self._hass.config_entries.async_get_entry(registry_entry.config_entry_id)
        if entry is None or entry.domain == DOMAIN or entry.disabled_by or entry.state in _BUSY:
            return
        _LOGGER.info("%s is unavailable while its backup is in charge: reloading %s", main, entry.title)
        try:
            await self._hass.config_entries.async_reload(entry.entry_id)
        except HomeAssistantError as err:
            _LOGGER.debug("Could not reload %s: %s", entry.title, err)
