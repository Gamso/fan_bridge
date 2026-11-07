"""The creation flow and the options flow."""
from __future__ import annotations

from homeassistant.data_entry_flow import FlowResultType

from custom_components.fan_bridge.const import DOMAIN

from .conftest import BACKUP, MAIN, make_entry, setup_entry


async def test_create_a_fan(hass):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] is FlowResultType.FORM

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"name": "Klassfan", "fan_entity": MAIN, "fallback_fan_entity": BACKUP}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Klassfan"
    assert result["data"] == {"name": "Klassfan", "fan_entity": MAIN, "fallback_fan_entity": BACKUP}


async def test_backup_is_optional(hass):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"name": "Solo", "fan_entity": MAIN})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert "fallback_fan_entity" not in result["data"]


async def test_backup_must_differ_from_the_main_fan(hass):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"name": "Klassfan", "fan_entity": MAIN, "fallback_fan_entity": MAIN}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"fallback_fan_entity": "same_fan"}


async def test_a_fan_is_configured_once(hass):
    await setup_entry(hass, make_entry())
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"name": "Again", "fan_entity": MAIN})
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def _menu(hass, flow_id, step):
    return await hass.config_entries.options.async_configure(flow_id, {"next_step_id": step})


async def test_options_entities_and_speeds_are_saved_together(hass):
    entry = await setup_entry(hass, make_entry())
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.MENU
    flow_id = result["flow_id"]

    result = await _menu(hass, flow_id, "entities")
    result = await hass.config_entries.options.async_configure(
        flow_id,
        {"fan_entity": MAIN, "fallback_fan_entity": BACKUP, "light_entity": "light.a", "fallback_light_entity": "light.b", "sound_entity": "switch.c"},
    )
    assert result["type"] is FlowResultType.MENU

    result = await _menu(hass, flow_id, "speeds")
    result = await hass.config_entries.options.async_configure(flow_id, {"fallback_speed_percentages": "1, 21, 41, 60, 80, 100"})
    assert result["type"] is FlowResultType.MENU

    result = await _menu(hass, flow_id, "save")
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"]["light_entity"] == "light.a"
    assert result["data"]["fallback_light_entity"] == "light.b"
    assert result["data"]["fallback_speed_percentages"] == "1, 21, 41, 60, 80, 100"
    assert result["data"]["speed_percentages"] == ""


async def test_options_reject_invalid_speeds(hass):
    entry = await setup_entry(hass, make_entry())
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await _menu(hass, result["flow_id"], "speeds")
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"speed_percentages": "5, 3"})
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"speed_percentages": "invalid_speeds"}


async def test_options_clearing_a_role_removes_it(hass):
    entry = await setup_entry(hass, make_entry({"light_entity": "light.a"}))
    result = await hass.config_entries.options.async_init(entry.entry_id)
    flow_id = result["flow_id"]
    await _menu(hass, flow_id, "entities")
    await hass.config_entries.options.async_configure(flow_id, {"fan_entity": MAIN})
    result = await _menu(hass, flow_id, "save")
    assert result["data"]["light_entity"] == ""


async def test_options_add_and_remove_remote_buttons(hass):
    entry = await setup_entry(hass, make_entry())
    result = await hass.config_entries.options.async_init(entry.entry_id)
    flow_id = result["flow_id"]

    await _menu(hass, flow_id, "remotes")
    await _menu(hass, flow_id, "remote_add")
    result = await hass.config_entries.options.async_configure(
        flow_id, {"source": "mqtt", "topic": "z2m/remote/action", "payload": "1_single", "action": "light_toggle", "speed": 1}
    )
    assert result["type"] is FlowResultType.MENU  # back on the remotes menu

    await _menu(hass, flow_id, "remote_add")
    result = await hass.config_entries.options.async_configure(
        flow_id, {"source": "entity", "entity_id": "event.remote", "payload": "up", "action": "set_speed", "speed": 4}
    )

    result = await _menu(hass, flow_id, "menu")
    result = await _menu(hass, flow_id, "save")
    assert result["data"]["remotes"] == [
        {"source": "mqtt", "topic": "z2m/remote/action", "payload": "1_single", "action": "light_toggle"},
        {"source": "entity", "entity_id": "event.remote", "payload": "up", "action": "set_speed", "speed": 4},
    ]


async def test_remote_button_needs_its_source(hass):
    entry = await setup_entry(hass, make_entry())
    result = await hass.config_entries.options.async_init(entry.entry_id)
    flow_id = result["flow_id"]
    await _menu(hass, flow_id, "remotes")
    await _menu(hass, flow_id, "remote_add")

    result = await hass.config_entries.options.async_configure(flow_id, {"source": "mqtt", "action": "fan_toggle", "speed": 1})
    assert result["errors"] == {"topic": "topic_required"}
    result = await hass.config_entries.options.async_configure(flow_id, {"source": "entity", "action": "fan_toggle", "speed": 1})
    assert result["errors"] == {"entity_id": "entity_required"}


async def test_remove_remote_buttons(hass):
    remotes = [
        {"source": "mqtt", "topic": "a", "payload": "x", "action": "fan_toggle"},
        {"source": "mqtt", "topic": "b", "payload": "y", "action": "light_toggle"},
    ]
    entry = await setup_entry(hass, make_entry(options={"remotes": remotes}))
    result = await hass.config_entries.options.async_init(entry.entry_id)
    flow_id = result["flow_id"]
    await _menu(hass, flow_id, "remotes")
    await _menu(hass, flow_id, "remote_remove")
    await hass.config_entries.options.async_configure(flow_id, {"remove": ["0"]})
    await _menu(hass, flow_id, "menu")
    result = await _menu(hass, flow_id, "save")
    assert result["data"]["remotes"] == [remotes[1]]
