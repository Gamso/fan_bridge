"""Remote buttons drive the merged entities."""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from .conftest import BACKUP, FAN_ATTRS, MAIN, make_entry, setup_entry

SENSOR = "sensor.remote_action"


def _fans(hass, main_state="on", pct=50, direction="forward", oscillating=False):
    hass.states.async_set(
        MAIN,
        main_state,
        {
            **FAN_ATTRS,
            "percentage": pct,
            "percentage_step": 16.67,
            "direction": direction,
            "oscillating": oscillating,
            "preset_modes": ["normal", "nature", "strong"],
            "preset_mode": "normal",
        },
    )
    hass.states.async_set(BACKUP, "on", {**FAN_ATTRS, "percentage": 1, "percentage_step": 1})
    hass.states.async_set("light.klass_offline", "off", {"supported_color_modes": ["onoff"]})
    hass.states.async_set("switch.beep", "on")


def _mapping(action, payload="2_single", **extra):
    return {"source": "entity", "entity_id": SENSOR, "payload": payload, "action": action, **extra}


async def _press(hass, payload):
    hass.states.async_set(SENSOR, "")
    await hass.async_block_till_done()
    hass.states.async_set(SENSOR, payload)
    await hass.async_block_till_done()


def _called(calls):
    """The (domain, service, data) of every call that was not made to a merged entity."""
    return [(c.args[0], c.args[1], c.args[2]) for c in calls.await_args_list]


@pytest.mark.parametrize(
    ("action", "expected"),
    [
        ("fan_toggle", ("fan", "toggle", {"entity_id": "fan.klassfan"})),
        ("fan_on", ("fan", "turn_on", {"entity_id": "fan.klassfan"})),
        ("fan_off", ("fan", "turn_off", {"entity_id": "fan.klassfan"})),
        ("speed_up", ("fan", "increase_speed", {"entity_id": "fan.klassfan"})),
        ("speed_down", ("fan", "decrease_speed", {"entity_id": "fan.klassfan"})),
        ("light_toggle", ("light", "toggle", {"entity_id": "light.klassfan_light"})),
        ("light_on", ("light", "turn_on", {"entity_id": "light.klassfan_light"})),
        ("light_off", ("light", "turn_off", {"entity_id": "light.klassfan_light"})),
        ("sound_toggle", ("switch", "toggle", {"entity_id": "switch.klassfan_sound"})),
        ("direction_reverse", ("fan", "set_direction", {"entity_id": "fan.klassfan", "direction": "reverse"})),
        ("direction_forward", ("fan", "set_direction", {"entity_id": "fan.klassfan", "direction": "forward"})),
        ("direction_toggle", ("fan", "set_direction", {"entity_id": "fan.klassfan", "direction": "reverse"})),
        ("oscillate_toggle", ("fan", "oscillate", {"entity_id": "fan.klassfan", "oscillating": True})),
        ("preset_next", ("fan", "set_preset_mode", {"entity_id": "fan.klassfan", "preset_mode": "nature"})),
        ("set_speed", ("fan", "set_percentage", {"entity_id": "fan.klassfan", "percentage": 66})),
    ],
)
async def test_entity_button_runs_its_action(hass, patch_services, action, expected):
    _fans(hass)
    extra = {"speed": 4} if action == "set_speed" else {}
    await setup_entry(hass, make_entry({"light_entity": "light.klass_offline", "sound_entity": "switch.beep"}, {"remotes": [_mapping(action, **extra)]}))
    calls = patch_services()

    await _press(hass, "2_single")

    assert expected in _called(calls)


async def test_a_different_payload_does_nothing(hass, patch_services):
    _fans(hass)
    await setup_entry(hass, make_entry(options={"remotes": [_mapping("fan_toggle")]}))
    calls = patch_services()
    await _press(hass, "3_single")
    assert not calls.await_args_list


async def test_an_empty_payload_matches_any_press(hass, patch_services):
    _fans(hass)
    await setup_entry(hass, make_entry(options={"remotes": [_mapping("fan_toggle", payload="")]}))
    calls = patch_services()
    await _press(hass, "anything")
    assert ("fan", "toggle", {"entity_id": "fan.klassfan"}) in _called(calls)


async def test_event_entity_matches_its_event_type(hass, patch_services):
    _fans(hass)
    mapping = {"source": "entity", "entity_id": "event.remote", "payload": "up", "action": "speed_up"}
    await setup_entry(hass, make_entry(options={"remotes": [mapping]}))
    calls = patch_services()

    hass.states.async_set("event.remote", "2026-11-03T10:00:00", {"event_type": "down"})
    await hass.async_block_till_done()
    assert not calls.await_args_list

    hass.states.async_set("event.remote", "2026-11-03T10:00:05", {"event_type": "up"})
    await hass.async_block_till_done()
    assert ("fan", "increase_speed", {"entity_id": "fan.klassfan"}) in _called(calls)


async def test_set_speed_uses_the_backup_fans_table(hass, patch_services):
    """The remote goes through the merged fan, which sends the backup's own percentage."""
    _fans(hass, main_state="unavailable")
    await setup_entry(
        hass,
        make_entry(options={"fallback_speed_percentages": "1, 21, 41, 60, 80, 100", "remotes": [_mapping("set_speed", speed=2)]}),
    )
    calls = patch_services()
    await _press(hass, "2_single")
    # The remote asks the merged fan for speed 2 (33 %)...
    assert ("fan", "set_percentage", {"entity_id": "fan.klassfan", "percentage": 33}) in _called(calls)


async def test_mqtt_button_runs_its_action(hass, patch_services):
    _fans(hass)
    mapping = {"source": "mqtt", "topic": "zigbee2mqtt/remote/action", "payload": "1_single", "action": "fan_toggle"}
    unsubscribe = MagicMock()
    with patch("homeassistant.components.mqtt.async_subscribe", return_value=unsubscribe) as subscribe:
        entry = await setup_entry(hass, make_entry(options={"remotes": [mapping]}))
        topic, callback = subscribe.call_args.args[1], subscribe.call_args.args[2]
        assert topic == "zigbee2mqtt/remote/action"

        calls = patch_services()
        callback(SimpleNamespace(payload="2_single"))
        await hass.async_block_till_done()
        assert not calls.await_args_list

        callback(SimpleNamespace(payload=b"1_single"))
        await hass.async_block_till_done()
        assert ("fan", "toggle", {"entity_id": "fan.klassfan"}) in _called(calls)

        await hass.config_entries.async_unload(entry.entry_id)
        unsubscribe.assert_called_once()


async def test_mqtt_not_available_is_not_fatal(hass):
    from homeassistant.exceptions import HomeAssistantError

    _fans(hass)
    mapping = {"source": "mqtt", "topic": "t", "payload": "x", "action": "fan_toggle"}
    with patch("homeassistant.components.mqtt.async_subscribe", side_effect=HomeAssistantError("no mqtt")):
        entry = await setup_entry(hass, make_entry(options={"remotes": [mapping]}))
    assert hass.states.get("fan.klassfan") is not None
    assert entry.state.name == "LOADED"


async def test_action_without_the_entity_is_ignored(hass, patch_services):
    """No light configured: a light button logs a warning and does nothing."""
    _fans(hass)
    await setup_entry(hass, make_entry(options={"remotes": [_mapping("light_toggle")]}))
    calls = patch_services()
    await _press(hass, "2_single")
    assert not calls.await_args_list
