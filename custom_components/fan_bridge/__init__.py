"""The FanBridge integration: one fan from a main and a backup entity."""
from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .frontend import async_register_card
from .const import CONF_RELOAD_MAIN
from .group import FanGroup, merged_config
from .recovery import MainRecovery
from .remotes import RemoteManager

PLATFORMS: list[Platform] = [Platform.FAN, Platform.LIGHT, Platform.SELECT, Platform.SWITCH]

type FanBridgeConfigEntry = ConfigEntry[FanGroup]


async def async_setup_entry(hass: HomeAssistant, entry: FanBridgeConfigEntry) -> bool:
    """Set up the merged entities, the remotes and the bundled card."""
    await async_register_card(hass)

    entry.runtime_data = FanGroup(hass, entry)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    for unsubscribe in await RemoteManager(hass, entry.runtime_data).async_start():
        entry.async_on_unload(unsubscribe)

    if merged_config(entry).get(CONF_RELOAD_MAIN):
        entry.async_on_unload(MainRecovery(hass, entry.runtime_data).async_start())

    # The options flow rewrites the entry: rebuild everything from it.
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    return True


async def _async_reload(hass: HomeAssistant, entry: FanBridgeConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: FanBridgeConfigEntry) -> bool:
    """Unload the entities and stop listening to the remotes."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
