"""Following renamed source entities."""
from __future__ import annotations

from homeassistant.helpers import entity_registry as er

from custom_components.fan_bridge.renames import rename_entity

from .conftest import BACKUP, MAIN, make_entry, setup_entry


def test_rename_entity_replaces_every_use():
    config = {
        "fan_entity": "fan.a",
        "light_entity": "light.a",
        "remotes": [{"source": "entity", "entity_id": "event.remote", "action": "fan_toggle"}, {"source": "mqtt", "topic": "t"}],
    }
    assert rename_entity(config, "light.a", "light.b")["light_entity"] == "light.b"
    assert rename_entity(config, "event.remote", "event.button")["remotes"][0]["entity_id"] == "event.button"
    assert rename_entity(config, "light.other", "light.b") is None
    assert config["light_entity"] == "light.a"  # not modified in place


async def test_a_renamed_source_is_written_back(hass):
    registry = er.async_get(hass)
    main = registry.async_get_or_create("fan", "test", "main", suggested_object_id=MAIN.split(".")[1])
    assert main.entity_id == MAIN
    light = registry.async_get_or_create("light", "test", "lamp", suggested_object_id="lamp")
    hass.states.async_set(MAIN, "on")
    hass.states.async_set(BACKUP, "on")
    entry = await setup_entry(hass, make_entry({"light_entity": light.entity_id}, options={"light_entity": light.entity_id}))

    registry.async_update_entity(light.entity_id, new_entity_id="light.salon")
    registry.async_update_entity(MAIN, new_entity_id="fan.salon")
    await hass.async_block_till_done()

    assert entry.data["light_entity"] == "light.salon"
    assert entry.options["light_entity"] == "light.salon"
    assert entry.data["fan_entity"] == "fan.salon"
    assert entry.unique_id == "fan.salon"
    assert hass.states.get("fan.klassfan").attributes["source_entity"] in ("fan.salon", BACKUP)
