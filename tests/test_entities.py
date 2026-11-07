"""The merged fan, light, beep and timer."""
from __future__ import annotations

from homeassistant.helpers import entity_registry as er

from .conftest import BACKUP, FAN_ATTRS, MAIN, make_entry, setup_entry

TABLE = "1, 21, 41, 60, 80, 100"
LIGHT_MAIN, LIGHT_BACKUP = "light.klass_offline", "light.klass_online"


def _fans(hass, main_state="on", main_pct=50, backup_state="on", backup_pct=41):
    hass.states.async_set(
        MAIN,
        main_state,
        {**FAN_ATTRS, "percentage": main_pct, "percentage_step": 16.67, "direction": "forward", "preset_modes": ["normal", "nature"], "preset_mode": "normal"},
    )
    hass.states.async_set(
        BACKUP,
        backup_state,
        {**FAN_ATTRS, "percentage": backup_pct, "percentage_step": 1, "direction": "reverse", "preset_modes": ["sleep", "nature"], "preset_mode": None},
    )


async def test_entity_ids_are_pinned_to_the_name(hass):
    _fans(hass)
    entry = await setup_entry(hass, make_entry({"light_entity": LIGHT_MAIN, "sound_entity": "switch.s", "timer_entity": "number.t"}))
    registry = er.async_get(hass)
    for platform, key, entity_id in (
        ("fan", "fan", "fan.klassfan"),
        ("light", "light", "light.klassfan_light"),
        ("switch", "sound", "switch.klassfan_sound"),
        ("select", "timer", "select.klassfan_timer"),
    ):
        assert registry.async_get_entity_id(platform, "fan_bridge", f"{entry.entry_id}_{key}") == entity_id


async def test_fan_follows_the_main_fan_while_it_works(hass):
    _fans(hass)
    await setup_entry(hass, make_entry(options={"fallback_speed_percentages": TABLE}))
    state = hass.states.get("fan.klassfan")
    assert state.state == "on"
    assert state.attributes["percentage"] == 50
    assert state.attributes["percentage_step"] == 100 / 6
    assert state.attributes["source_entity"] == MAIN
    assert state.attributes["using_backup"] is False
    assert state.attributes["direction"] == "forward"
    assert state.attributes["preset_modes"] == ["normal", "nature"]


async def test_fan_switches_to_the_backup_and_back(hass):
    _fans(hass)
    await setup_entry(hass, make_entry(options={"fallback_speed_percentages": TABLE}))

    _fans(hass, main_state="unavailable")
    await hass.async_block_till_done()
    state = hass.states.get("fan.klassfan")
    # 41 on the backup table is its third speed: 50 % here.
    assert state.attributes["percentage"] == 50
    assert state.attributes["source_entity"] == BACKUP
    assert state.attributes["using_backup"] is True
    assert state.attributes["direction"] == "reverse"
    assert state.attributes["preset_modes"] == ["sleep", "nature"]

    _fans(hass)
    await hass.async_block_till_done()
    assert hass.states.get("fan.klassfan").attributes["source_entity"] == MAIN


async def test_fan_is_unavailable_only_when_both_are(hass):
    _fans(hass, main_state="unavailable", backup_state="unavailable")
    await setup_entry(hass, make_entry())
    assert hass.states.get("fan.klassfan").state == "unavailable"


async def test_commands_go_to_the_fan_in_charge_with_its_own_percentages(hass, patch_services):
    _fans(hass, main_state="unavailable")
    await setup_entry(hass, make_entry(options={"fallback_speed_percentages": TABLE}))
    entity = hass.data["fan"].get_entity("fan.klassfan")
    calls = patch_services()

    await entity.async_set_percentage(33)  # our speed 2
    await entity.async_turn_on(percentage=100)
    await entity.async_turn_off()
    await entity.async_set_direction("forward")

    calls = [(c.args[0], c.args[1], c.args[2]) for c in calls.await_args_list]
    assert calls == [
        ("fan", "set_percentage", {"entity_id": BACKUP, "percentage": 21}),
        ("fan", "turn_on", {"entity_id": BACKUP, "percentage": 100}),
        ("fan", "turn_off", {"entity_id": BACKUP}),
        ("fan", "set_direction", {"entity_id": BACKUP, "direction": "forward"}),
    ]


async def test_main_fan_without_a_table_gets_even_percentages(hass, patch_services):
    _fans(hass)
    await setup_entry(hass, make_entry(options={"fallback_speed_percentages": TABLE}))
    entity = hass.data["fan"].get_entity("fan.klassfan")
    calls = patch_services()
    await entity.async_set_percentage(66)
    assert calls.await_args.args[2] == {"entity_id": MAIN, "percentage": 66}


async def test_light_mirrors_the_light_in_charge(hass, patch_services):
    _fans(hass)
    hass.states.async_set(LIGHT_MAIN, "off", {"supported_color_modes": ["brightness"], "color_mode": None})
    hass.states.async_set(
        LIGHT_BACKUP,
        "on",
        {"supported_color_modes": ["color_temp"], "color_mode": "color_temp", "color_temp_kelvin": 4000, "min_color_temp_kelvin": 2000, "max_color_temp_kelvin": 6500},
    )
    await setup_entry(hass, make_entry({"light_entity": LIGHT_MAIN, "fallback_light_entity": LIGHT_BACKUP}))
    assert hass.states.get("light.klassfan_light").state == "off"

    hass.states.async_set(LIGHT_MAIN, "unavailable")
    await hass.async_block_till_done()
    state = hass.states.get("light.klassfan_light")
    assert state.state == "on"
    assert state.attributes["color_temp_kelvin"] == 4000
    assert state.attributes["source_entity"] == LIGHT_BACKUP

    entity = hass.data["light"].get_entity("light.klassfan_light")
    calls = patch_services()
    await entity.async_turn_on(color_temp_kelvin=3000)
    assert calls.await_args.args[:3] == ("light", "turn_on", {"entity_id": LIGHT_BACKUP, "color_temp_kelvin": 3000})


async def test_light_is_independent_of_the_fan(hass):
    """The light follows its own availability, not that of the fan."""
    _fans(hass, main_state="unavailable", backup_state="unavailable")
    hass.states.async_set(LIGHT_MAIN, "on", {"supported_color_modes": ["onoff"], "color_mode": "onoff"})
    await setup_entry(hass, make_entry({"light_entity": LIGHT_MAIN}))
    assert hass.states.get("light.klassfan_light").state == "on"


async def test_beep_switch_is_merged(hass, patch_services):
    _fans(hass)
    hass.states.async_set("switch.beep_main", "unavailable")
    hass.states.async_set("switch.beep_backup", "on")
    await setup_entry(hass, make_entry({"sound_entity": "switch.beep_main", "fallback_sound_entity": "switch.beep_backup"}))
    state = hass.states.get("switch.klassfan_sound")
    assert state.state == "on"
    assert state.attributes["source_entity"] == "switch.beep_backup"

    entity = hass.data["switch"].get_entity("switch.klassfan_sound")
    calls = patch_services()
    await entity.async_turn_off()
    assert calls.await_args.args[:3] == ("switch", "turn_off", {"entity_id": "switch.beep_backup"})


async def test_number_timer_is_offered_as_presets(hass, patch_services):
    _fans(hass)
    hass.states.async_set("number.timer", "45")
    await setup_entry(hass, make_entry({"timer_entity": "number.timer"}))
    state = hass.states.get("select.klassfan_timer")
    assert state.state == "45 min"
    assert state.attributes["options"] == ["off", "15 min", "30 min", "45 min", "1 h", "2 h", "4 h", "8 h"]

    entity = hass.data["select"].get_entity("select.klassfan_timer")
    calls = patch_services()
    await entity.async_select_option("2 h")
    assert calls.await_args.args[:3] == ("number", "set_value", {"entity_id": "number.timer", "value": 120})


async def test_select_timer_keeps_its_own_options(hass, patch_services):
    _fans(hass)
    hass.states.async_set("select.timer", "1h", {"options": ["off", "1h", "2h"]})
    await setup_entry(hass, make_entry({"timer_entity": "select.timer"}))
    state = hass.states.get("select.klassfan_timer")
    assert state.state == "1h"
    assert state.attributes["options"] == ["off", "1h", "2h"]

    entity = hass.data["select"].get_entity("select.klassfan_timer")
    calls = patch_services()
    await entity.async_select_option("2h")
    assert calls.await_args.args[:3] == ("select", "select_option", {"entity_id": "select.timer", "option": "2h"})


async def test_unconfigured_roles_create_no_entity(hass):
    _fans(hass)
    await setup_entry(hass, make_entry())
    assert hass.states.get("light.klassfan_light") is None
    assert hass.states.get("switch.klassfan_sound") is None
    assert hass.states.get("select.klassfan_timer") is None


async def test_unload(hass):
    _fans(hass)
    entry = await setup_entry(hass, make_entry())
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get("fan.klassfan").state == "unavailable"
