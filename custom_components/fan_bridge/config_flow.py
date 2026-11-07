"""Config flow for the FanBridge integration."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    ACTION_SET_SPEED,
    CONF_FALLBACK_FAN,
    CONF_FALLBACK_LIGHT,
    CONF_FALLBACK_SOUND,
    CONF_FALLBACK_SPEEDS,
    CONF_FALLBACK_TIMER,
    CONF_FAN,
    CONF_LIGHT,
    CONF_NAME,
    CONF_REMOTE_ACTION,
    CONF_REMOTE_ENTITY,
    CONF_REMOTE_PAYLOAD,
    CONF_REMOTE_SOURCE,
    CONF_REMOTE_SPEED,
    CONF_REMOTE_TOPIC,
    CONF_PRESENCE,
    CONF_RELOAD_MAIN,
    CONF_REMOTES,
    CONF_SOUND,
    CONF_SPEEDS,
    CONF_TIMER,
    DOMAIN,
    MAX_SPEED_COUNT,
    REMOTE_ACTIONS,
    REMOTE_SOURCES,
    SOURCE_ENTITY,
    SOURCE_MQTT,
)
from .group import merged_config
from .helpers import parse_speed_percentages
from .remotes import remote_summary


def _entity_marker(key: str, value: Any, *, required: bool = False) -> vol.Marker:
    """Schema marker for an entity field that may currently be empty.

    An EntitySelector rejects "" as an entity id, so a stored value is offered
    as a suggestion: the frontend prefills it, and an untouched or cleared
    field simply stays out of the submitted data.
    """
    marker = vol.Required if required else vol.Optional
    if value:
        return marker(key, description={"suggested_value": value})
    return marker(key)


def _entity(domain: str | list[str]) -> selector.EntitySelector:
    return selector.EntitySelector(selector.EntitySelectorConfig(domain=domain))


def _text(value: str | None, key: str) -> vol.Marker:
    return vol.Optional(key, description={"suggested_value": value or ""})


class FanBridgeConfigFlow(ConfigFlow, domain=DOMAIN):
    """Create one fan: a name, a main fan and an optional backup."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> FanBridgeOptionsFlow:
        return FanBridgeOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            fan, backup = user_input[CONF_FAN], user_input.get(CONF_FALLBACK_FAN)
            await self.async_set_unique_id(fan)
            self._abort_if_unique_id_configured()
            if backup == fan:
                errors[CONF_FALLBACK_FAN] = "same_fan"
            else:
                data = {key: value for key, value in user_input.items() if value}
                return self.async_create_entry(title=user_input[CONF_NAME], data=data)

        data = user_input or {}
        schema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=data.get(CONF_NAME, "")): selector.TextSelector(),
                _entity_marker(CONF_FAN, data.get(CONF_FAN), required=True): _entity("fan"),
                _entity_marker(CONF_FALLBACK_FAN, data.get(CONF_FALLBACK_FAN)): _entity("fan"),
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)


class FanBridgeOptionsFlow(OptionsFlow):
    """Edit the entities, the speeds and the remotes of a fan.

    Nothing is saved before "Save": the working copy lives in the flow, so
    closing the dialog drops the changes (and the entry is reloaded once).
    """

    def __init__(self) -> None:
        self._options: dict[str, Any] = {}

    def _current(self) -> dict[str, Any]:
        return {**merged_config(self.config_entry), **self._options}

    @property
    def _remotes(self) -> list[dict[str, Any]]:
        return list(self._current().get(CONF_REMOTES) or [])

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        return await self.async_step_menu()

    async def async_step_menu(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        return self.async_show_menu(
            step_id="menu",
            menu_options=["entities", "speeds", "remotes", "save"],
            description_placeholders={"remote_count": str(len(self._remotes))},
        )

    async def async_step_save(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        return self.async_create_entry(title="", data={**self.config_entry.options, **self._options})

    # ── Entities ────────────────────────────────────────────────────────────

    async def async_step_entities(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        current = self._current()
        if user_input is not None:
            if user_input.get(CONF_FALLBACK_FAN) and user_input[CONF_FALLBACK_FAN] == user_input[CONF_FAN]:
                errors[CONF_FALLBACK_FAN] = "same_fan"
            else:
                # An emptied field is stored as absent, and overrides what the
                # creation flow stored.
                for key in (CONF_FAN, CONF_FALLBACK_FAN, CONF_LIGHT, CONF_FALLBACK_LIGHT, CONF_TIMER, CONF_FALLBACK_TIMER, CONF_SOUND, CONF_FALLBACK_SOUND):
                    self._options[key] = user_input.get(key) or ""
                self._options[CONF_RELOAD_MAIN] = bool(user_input.get(CONF_RELOAD_MAIN))
                self._options[CONF_PRESENCE] = user_input.get(CONF_PRESENCE) or ""
                return await self.async_step_menu()

        data = user_input or current
        schema = vol.Schema(
            {
                _entity_marker(CONF_FAN, data.get(CONF_FAN), required=True): _entity("fan"),
                _entity_marker(CONF_FALLBACK_FAN, data.get(CONF_FALLBACK_FAN)): _entity("fan"),
                _entity_marker(CONF_LIGHT, data.get(CONF_LIGHT)): _entity("light"),
                _entity_marker(CONF_FALLBACK_LIGHT, data.get(CONF_FALLBACK_LIGHT)): _entity("light"),
                _entity_marker(CONF_TIMER, data.get(CONF_TIMER)): _entity(["number", "select"]),
                _entity_marker(CONF_FALLBACK_TIMER, data.get(CONF_FALLBACK_TIMER)): _entity(["number", "select"]),
                _entity_marker(CONF_SOUND, data.get(CONF_SOUND)): _entity("switch"),
                _entity_marker(CONF_FALLBACK_SOUND, data.get(CONF_FALLBACK_SOUND)): _entity("switch"),
                vol.Optional(CONF_RELOAD_MAIN, default=bool(data.get(CONF_RELOAD_MAIN))): selector.BooleanSelector(),
                _entity_marker(CONF_PRESENCE, data.get(CONF_PRESENCE)): _entity(["binary_sensor", "device_tracker"]),
            }
        )
        return self.async_show_form(step_id="entities", data_schema=schema, errors=errors)

    # ── Speeds ──────────────────────────────────────────────────────────────

    async def async_step_speeds(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        current = self._current()
        if user_input is not None:
            for key in (CONF_SPEEDS, CONF_FALLBACK_SPEEDS):
                text = (user_input.get(key) or "").strip()
                if text and parse_speed_percentages(text) is None:
                    errors[key] = "invalid_speeds"
            if not errors:
                for key in (CONF_SPEEDS, CONF_FALLBACK_SPEEDS):
                    self._options[key] = (user_input.get(key) or "").strip()
                return await self.async_step_menu()

        data = user_input or current
        schema = vol.Schema(
            {
                _text(_as_text(data.get(CONF_SPEEDS)), CONF_SPEEDS): selector.TextSelector(),
                _text(_as_text(data.get(CONF_FALLBACK_SPEEDS)), CONF_FALLBACK_SPEEDS): selector.TextSelector(),
            }
        )
        return self.async_show_form(
            step_id="speeds",
            data_schema=schema,
            errors=errors,
            description_placeholders={"max": str(MAX_SPEED_COUNT)},
        )

    # ── Remotes ─────────────────────────────────────────────────────────────

    async def async_step_remotes(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        summary = "\n".join(f"• {remote_summary(item)}" for item in self._remotes) or "—"
        return self.async_show_menu(
            step_id="remotes",
            menu_options=["remote_add", "remote_remove", "menu"],
            description_placeholders={"remotes": summary},
        )

    async def async_step_remote_add(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            source = user_input[CONF_REMOTE_SOURCE]
            if source == SOURCE_MQTT and not user_input.get(CONF_REMOTE_TOPIC):
                errors[CONF_REMOTE_TOPIC] = "topic_required"
            elif source == SOURCE_ENTITY and not user_input.get(CONF_REMOTE_ENTITY):
                errors[CONF_REMOTE_ENTITY] = "entity_required"
            else:
                item = {key: value for key, value in user_input.items() if value not in (None, "")}
                if item.get(CONF_REMOTE_ACTION) == ACTION_SET_SPEED:
                    item[CONF_REMOTE_SPEED] = int(item.get(CONF_REMOTE_SPEED) or 1)
                else:
                    item.pop(CONF_REMOTE_SPEED, None)
                self._options[CONF_REMOTES] = [*self._remotes, item]
                return await self.async_step_remotes()

        data = user_input or {}
        schema = vol.Schema(
            {
                vol.Required(CONF_REMOTE_SOURCE, default=data.get(CONF_REMOTE_SOURCE, SOURCE_MQTT)): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=list(REMOTE_SOURCES),
                        mode=selector.SelectSelectorMode.LIST,
                        translation_key="remote_source",
                    )
                ),
                _text(data.get(CONF_REMOTE_TOPIC), CONF_REMOTE_TOPIC): selector.TextSelector(),
                _entity_marker(CONF_REMOTE_ENTITY, data.get(CONF_REMOTE_ENTITY)): _entity(["event", "sensor", "binary_sensor", "input_text", "select"]),
                _text(data.get(CONF_REMOTE_PAYLOAD), CONF_REMOTE_PAYLOAD): selector.TextSelector(),
                vol.Required(CONF_REMOTE_ACTION, default=data.get(CONF_REMOTE_ACTION, REMOTE_ACTIONS[0])): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=list(REMOTE_ACTIONS),
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        translation_key="remote_action",
                    )
                ),
                vol.Optional(CONF_REMOTE_SPEED, default=data.get(CONF_REMOTE_SPEED, 1)): selector.NumberSelector(
                    selector.NumberSelectorConfig(min=1, max=MAX_SPEED_COUNT, step=1, mode=selector.NumberSelectorMode.BOX)
                ),
            }
        )
        return self.async_show_form(step_id="remote_add", data_schema=schema, errors=errors)

    async def async_step_remote_remove(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        remotes = self._remotes
        if user_input is not None:
            drop = {int(index) for index in user_input.get("remove", [])}
            self._options[CONF_REMOTES] = [item for index, item in enumerate(remotes) if index not in drop]
            return await self.async_step_remotes()
        if not remotes:
            return await self.async_step_remotes()
        schema = vol.Schema(
            {
                vol.Optional("remove", default=[]): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[selector.SelectOptionDict(value=str(index), label=remote_summary(item)) for index, item in enumerate(remotes)],
                        multiple=True,
                        mode=selector.SelectSelectorMode.LIST,
                    )
                )
            }
        )
        return self.async_show_form(step_id="remote_remove", data_schema=schema)


def _as_text(value: Any) -> str:
    """A stored speed list (a string, or a list from YAML) as editable text."""
    if isinstance(value, (list, tuple)):
        return ", ".join(str(item) for item in value)
    return str(value or "")
