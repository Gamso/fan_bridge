"""Base class and helpers shared by the FanBridge entities."""
from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, EventStateChangedData, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.util import slugify

from .const import DOMAIN
from .group import FanGroup


def device_info(entry: ConfigEntry, name: str) -> DeviceInfo:
    """One service device per fan, grouping its merged entities."""
    return DeviceInfo(
        identifiers={(DOMAIN, entry.entry_id)},
        name=name,
        manufacturer="Gamso",
        model="FanBridge",
        entry_type=DeviceEntryType.SERVICE,
    )


class FanBridgeEntity(Entity):
    """An entity that mirrors the main or the backup entity of one role."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, group: FanGroup, platform: str, role: str, key: str | None) -> None:
        self._group = group
        self._role = role
        entry = group.entry
        self._attr_unique_id = f"{entry.entry_id}_{key or role}"
        # The entity id is pinned to the English object id (fan.<name>,
        # light.<name>_light...), whatever the instance language: it is the
        # one the dashboards and the card's auto-discovery rely on. It only
        # applies when the entity is first registered.
        base = slugify(group.name)
        self.entity_id = f"{platform}.{base}_{key}" if key else f"{platform}.{base}"
        self._attr_device_info = device_info(entry, group.name)
        if key:
            self._attr_translation_key = key
        else:
            # The main entity of the device takes the device's name.
            self._attr_name = None

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(
            async_track_state_change_event(self.hass, self._group.pair(self._role).ids, self._source_changed)
        )

    @callback
    def _source_changed(self, event: Event[EventStateChangedData]) -> None:
        self.async_write_ha_state()

    @property
    def _source(self):
        """State of the entity in charge, None when it does not exist."""
        return self._group.active_state(self._role)

    @property
    def available(self) -> bool:
        return self._group.available(self._role)

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        return {
            "source_entity": self._group.active_id(self._role),
            "using_backup": self._group.using_backup(self._role),
        }

    async def _call(self, domain: str, service: str, data: dict | None = None) -> None:
        """Call a service on the entity in charge."""
        entity_id = self._group.active_id(self._role)
        if entity_id is None:
            return
        await self.hass.services.async_call(
            domain, service, {"entity_id": entity_id, **(data or {})}, blocking=True, context=self._context
        )
