"""Diagnostics and the handover event shown in the logbook."""
from __future__ import annotations

from pytest_homeassistant_custom_component.common import async_capture_events

from custom_components.fan_bridge.const import EVENT_SOURCE_CHANGED
from custom_components.fan_bridge.diagnostics import async_get_config_entry_diagnostics

from .conftest import BACKUP, FAN_ATTRS, MAIN, make_entry, setup_entry


async def test_diagnostics_show_who_is_in_charge(hass):
    hass.states.async_set(MAIN, "unavailable")
    hass.states.async_set(BACKUP, "on", {**FAN_ATTRS, "percentage": 50})
    entry = await setup_entry(hass, make_entry(options={"fallback_speed_percentages": "1, 21, 41, 60, 80, 100"}))

    diag = await async_get_config_entry_diagnostics(hass, entry)
    fan = diag["roles"]["fan"]
    assert fan["main"] == MAIN
    assert fan["in_charge"] == BACKUP
    assert fan["using_backup"] is True
    assert fan["states"][BACKUP]["state"] == "on"
    assert diag["speed_table"] == [1, 21, 41, 60, 80, 100]
    assert "light" not in diag["roles"]


async def test_the_handover_fires_an_event(hass):
    hass.states.async_set(MAIN, "on", FAN_ATTRS)
    hass.states.async_set(BACKUP, "on", FAN_ATTRS)
    await setup_entry(hass, make_entry())
    events = async_capture_events(hass, EVENT_SOURCE_CHANGED)

    hass.states.async_set(MAIN, "unavailable")
    await hass.async_block_till_done()
    hass.states.async_set(BACKUP, "on", {**FAN_ATTRS, "percentage": 20})  # no handover
    await hass.async_block_till_done()
    hass.states.async_set(MAIN, "on", FAN_ATTRS)
    await hass.async_block_till_done()

    assert [e.data for e in events] == [
        {"entity_id": "fan.klassfan", "role": "fan", "source_entity": BACKUP, "using_backup": True},
        {"entity_id": "fan.klassfan", "role": "fan", "source_entity": MAIN, "using_backup": False},
    ]
