"""Reloading the main fan's integration while the backup is in charge."""
from __future__ import annotations

from datetime import timedelta
from unittest.mock import AsyncMock, patch

from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.fan_bridge.const import RELOAD_DELAYS

from .conftest import BACKUP, FAN_ATTRS, MAIN, make_entry, setup_entry

PING = "binary_sensor.klass_ping"


def _fans(hass, main="unavailable", backup="on", *, registered=True):
    """The two fans' states; the main one is registered by another integration."""
    if registered:
        other = MockConfigEntry(domain="tuya_local", title="Klassfan Ceiling fan")
        other.add_to_hass(hass)
        er.async_get(hass).async_get_or_create("fan", "tuya_local", "abc", suggested_object_id="klass_offline", config_entry=other)
        hass.data["recovery_entry"] = other
    hass.states.async_set(MAIN, main, FAN_ATTRS)
    hass.states.async_set(BACKUP, backup, FAN_ATTRS)


def _main_integration(hass) -> MockConfigEntry:
    return hass.data["recovery_entry"]


async def _wait(hass, seconds):
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=seconds))
    await hass.async_block_till_done()


async def test_off_by_default(hass):
    _fans(hass)
    other = _main_integration(hass)
    with patch.object(hass.config_entries, "async_reload", new=AsyncMock()) as reload:
        await setup_entry(hass, make_entry())
        await _wait(hass, RELOAD_DELAYS[0] + 1)
    reload.assert_not_called()
    assert other.entry_id


async def test_reloads_the_main_integration_with_a_growing_delay(hass):
    _fans(hass)
    other = _main_integration(hass)
    with patch.object(hass.config_entries, "async_reload", new=AsyncMock()) as reload:
        await setup_entry(hass, make_entry({"reload_main": True}))
        await _wait(hass, RELOAD_DELAYS[0] + 1)
        reload.assert_awaited_once_with(other.entry_id)
        await _wait(hass, RELOAD_DELAYS[0] + RELOAD_DELAYS[1] + 2)
        assert reload.await_count == 2


async def test_stops_when_the_main_fan_is_back(hass):
    _fans(hass)
    _main_integration(hass)
    with patch.object(hass.config_entries, "async_reload", new=AsyncMock()) as reload:
        await setup_entry(hass, make_entry({"reload_main": True}))
        hass.states.async_set(MAIN, "on", FAN_ATTRS)
        await hass.async_block_till_done()
        await _wait(hass, RELOAD_DELAYS[0] + 1)
    reload.assert_not_called()


async def test_does_nothing_when_both_fans_are_down(hass):
    _fans(hass, backup="unavailable")
    with patch.object(hass.config_entries, "async_reload", new=AsyncMock()) as reload:
        await setup_entry(hass, make_entry({"reload_main": True}))
        await _wait(hass, RELOAD_DELAYS[0] + 1)
    reload.assert_not_called()


async def test_main_without_a_config_entry_is_left_alone(hass):
    _fans(hass, registered=False)  # a plain state: no registry entry
    with patch.object(hass.config_entries, "async_reload", new=AsyncMock()) as reload:
        await setup_entry(hass, make_entry({"reload_main": True}))
        await _wait(hass, RELOAD_DELAYS[0] + 1)
    reload.assert_not_called()


async def test_waits_while_the_presence_entity_is_off(hass):
    _fans(hass)
    _main_integration(hass)
    hass.states.async_set(PING, "off")
    with patch.object(hass.config_entries, "async_reload", new=AsyncMock()) as reload:
        await setup_entry(hass, make_entry({"reload_main": True, "presence_entity": PING}))
        await _wait(hass, RELOAD_DELAYS[0] + 1)
        reload.assert_not_called()


async def test_reloads_at_once_when_the_presence_entity_turns_on(hass):
    _fans(hass)
    other = _main_integration(hass)
    hass.states.async_set(PING, "off")
    with patch.object(hass.config_entries, "async_reload", new=AsyncMock()) as reload:
        await setup_entry(hass, make_entry({"reload_main": True, "presence_entity": PING}))
        hass.states.async_set(PING, "on")
        await hass.async_block_till_done()
        reload.assert_awaited_once_with(other.entry_id)


async def test_entities_step_stores_the_options(hass):
    _fans(hass)
    entry = await setup_entry(hass, make_entry())
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(flow["flow_id"], {"next_step_id": "entities"})
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"fan_entity": MAIN, "fallback_fan_entity": BACKUP, "reload_main": True, "presence_entity": PING}
    )
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "save"})
    assert result["data"]["reload_main"] is True
    assert result["data"]["presence_entity"] == PING
