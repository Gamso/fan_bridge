"""Remote buttons: press -> action on the merged entities.

A mapping ties one button press (an MQTT message, or the state of an entity
such as a Zigbee2MQTT action sensor or an event entity) to an action. Actions
go through the merged fan, light and beep entities, so the backup fan, the
speed tables and the availability rules apply to a remote like to the card.
"""
from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from homeassistant.core import Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    ACTION_DIRECTION_FORWARD,
    ACTION_DIRECTION_REVERSE,
    ACTION_DIRECTION_TOGGLE,
    ACTION_FAN_OFF,
    ACTION_FAN_ON,
    ACTION_FAN_TOGGLE,
    ACTION_LIGHT_OFF,
    ACTION_LIGHT_ON,
    ACTION_LIGHT_TOGGLE,
    ACTION_OSCILLATE_TOGGLE,
    ACTION_PRESET_NEXT,
    ACTION_SET_SPEED,
    ACTION_SOUND_TOGGLE,
    ACTION_SPEED_DOWN,
    ACTION_SPEED_UP,
    CONF_REMOTE_ACTION,
    CONF_REMOTE_ENTITY,
    CONF_REMOTE_PAYLOAD,
    CONF_REMOTE_SOURCE,
    CONF_REMOTE_SPEED,
    CONF_REMOTE_TOPIC,
    CONF_REMOTES,
    DOMAIN,
    SOURCE_ENTITY,
    SOURCE_MQTT,
)
from .group import FanGroup, merged_config
from .helpers import speed_to_command_percentage

_LOGGER = logging.getLogger(__name__)

# Services of the merged fan, light and switch, per simple action.
_SIMPLE_ACTIONS: dict[str, tuple[str, str, str, dict[str, Any]]] = {
    ACTION_FAN_TOGGLE: ("fan", "fan", "toggle", {}),
    ACTION_FAN_ON: ("fan", "fan", "turn_on", {}),
    ACTION_FAN_OFF: ("fan", "fan", "turn_off", {}),
    ACTION_SPEED_UP: ("fan", "fan", "increase_speed", {}),
    ACTION_SPEED_DOWN: ("fan", "fan", "decrease_speed", {}),
    ACTION_LIGHT_TOGGLE: ("light", "light", "toggle", {}),
    ACTION_LIGHT_ON: ("light", "light", "turn_on", {}),
    ACTION_LIGHT_OFF: ("light", "light", "turn_off", {}),
    ACTION_SOUND_TOGGLE: ("sound", "switch", "toggle", {}),
    ACTION_DIRECTION_FORWARD: ("fan", "fan", "set_direction", {"direction": "forward"}),
    ACTION_DIRECTION_REVERSE: ("fan", "fan", "set_direction", {"direction": "reverse"}),
}


def remote_summary(mapping: dict[str, Any]) -> str:
    """One-line description of a mapping, for the options flow."""
    source = mapping.get(CONF_REMOTE_TOPIC) or mapping.get(CONF_REMOTE_ENTITY) or "?"
    payload = mapping.get(CONF_REMOTE_PAYLOAD)
    action = mapping.get(CONF_REMOTE_ACTION, "?")
    if action == ACTION_SET_SPEED:
        action = f"{action} {mapping.get(CONF_REMOTE_SPEED)}"
    return f"{source} [{payload}] → {action}" if payload else f"{source} → {action}"


class RemoteManager:
    """Listen to the configured remote buttons of one fan."""

    def __init__(self, hass: HomeAssistant, group: FanGroup) -> None:
        self.hass = hass
        self._group = group
        self._mappings: list[dict[str, Any]] = [
            dict(item) for item in merged_config(group.entry).get(CONF_REMOTES) or [] if isinstance(item, dict)
        ]

    async def async_start(self) -> list[Callable[[], None]]:
        """Subscribe every mapping; return the callbacks that undo it."""
        unsubscribers: list[Callable[[], None]] = []
        for mapping in self._mappings:
            source = mapping.get(CONF_REMOTE_SOURCE)
            if source == SOURCE_MQTT:
                unsub = await self._subscribe_mqtt(mapping)
            elif source == SOURCE_ENTITY:
                unsub = self._subscribe_entity(mapping)
            else:
                unsub = None
            if unsub is not None:
                unsubscribers.append(unsub)
        return unsubscribers

    async def _subscribe_mqtt(self, mapping: dict[str, Any]) -> Callable[[], None] | None:
        from homeassistant.components import mqtt

        topic = mapping.get(CONF_REMOTE_TOPIC)
        if not topic:
            return None
        expected = str(mapping.get(CONF_REMOTE_PAYLOAD) or "")

        @callback
        def _message(msg: Any) -> None:
            payload = msg.payload.decode() if isinstance(msg.payload, bytes) else str(msg.payload)
            if not expected or payload == expected:
                self.hass.async_create_task(self.async_run(mapping))

        try:
            return await mqtt.async_subscribe(self.hass, topic, _message)
        except HomeAssistantError as err:
            _LOGGER.warning("Cannot listen to %s for %s: %s", topic, self._group.name, err)
            return None

    def _subscribe_entity(self, mapping: dict[str, Any]) -> Callable[[], None] | None:
        entity_id = mapping.get(CONF_REMOTE_ENTITY)
        if not entity_id:
            return None
        expected = str(mapping.get(CONF_REMOTE_PAYLOAD) or "")

        @callback
        def _changed(event: Event[EventStateChangedData]) -> None:
            new, old = event.data["new_state"], event.data["old_state"]
            if new is None or (old is not None and old.state == new.state and entity_id.split(".")[0] != "event"):
                return
            if new.state in ("unavailable", "unknown", ""):
                return
            # An event entity reports the kind of event in an attribute, its
            # state being the time of the last one; any other entity (a
            # Zigbee2MQTT action sensor) reports it as its state.
            seen = new.attributes.get("event_type") if entity_id.startswith("event.") else new.state
            if not expected or str(seen) == expected:
                self.hass.async_create_task(self.async_run(mapping))

        return async_track_state_change_event(self.hass, [entity_id], _changed)

    # ── Actions ─────────────────────────────────────────────────────────────

    def _entity_id(self, key: str, platform: str) -> str | None:
        """Entity id of one of this entry's merged entities."""
        return er.async_get(self.hass).async_get_entity_id(platform, DOMAIN, f"{self._group.entry.entry_id}_{key}")

    async def _service(self, key: str, platform: str, service: str, data: dict[str, Any] | None = None) -> None:
        entity_id = self._entity_id(key, platform)
        if entity_id is None:
            _LOGGER.warning("%s has no %s entity: the remote action is ignored", self._group.name, key)
            return
        await self.hass.services.async_call(platform, service, {"entity_id": entity_id, **(data or {})}, blocking=True)

    async def async_run(self, mapping: dict[str, Any]) -> None:
        """Run the action of a mapping."""
        action = mapping.get(CONF_REMOTE_ACTION)
        try:
            if action in _SIMPLE_ACTIONS:
                key, platform, service, data = _SIMPLE_ACTIONS[action]
                await self._service(key, platform, service, data)
            elif action == ACTION_SET_SPEED:
                speed = int(mapping.get(CONF_REMOTE_SPEED) or 1)
                count = self._group.speed_count
                await self._service("fan", "fan", "set_percentage", {"percentage": speed_to_command_percentage(min(speed, count), count)})
            elif action == ACTION_DIRECTION_TOGGLE:
                fan_state = self.hass.states.get(self._entity_id("fan", "fan") or "")
                reverse = fan_state is not None and fan_state.attributes.get("direction") == "reverse"
                await self._service("fan", "fan", "set_direction", {"direction": "forward" if reverse else "reverse"})
            elif action == ACTION_OSCILLATE_TOGGLE:
                fan_state = self.hass.states.get(self._entity_id("fan", "fan") or "")
                current = bool(fan_state and fan_state.attributes.get("oscillating"))
                await self._service("fan", "fan", "oscillate", {"oscillating": not current})
            elif action == ACTION_PRESET_NEXT:
                fan_state = self.hass.states.get(self._entity_id("fan", "fan") or "")
                modes = list(fan_state.attributes.get("preset_modes") or []) if fan_state else []
                if modes:
                    current = fan_state.attributes.get("preset_mode") if fan_state else None
                    nxt = modes[(modes.index(current) + 1) % len(modes)] if current in modes else modes[0]
                    await self._service("fan", "fan", "set_preset_mode", {"preset_mode": nxt})
            else:
                _LOGGER.warning("Unknown remote action %s", action)
        except HomeAssistantError as err:
            _LOGGER.warning("Remote action %s failed for %s: %s", action, self._group.name, err)
