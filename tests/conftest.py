"""Shared fixtures for the FanBridge integration tests."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.fan_bridge.const import DOMAIN


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Let Home Assistant load the integration from custom_components/."""
    yield


@pytest.fixture(autouse=True)
def no_card_registration():
    """The bundled card needs a real http/frontend; test_frontend.py covers it."""
    with patch("custom_components.fan_bridge.async_register_card", new=AsyncMock()):
        yield


MAIN = "fan.klass_offline"
BACKUP = "fan.klass_online"

FAN_ATTRS = {"supported_features": 1 | 4 | 8 | 16 | 32}


def make_entry(data: dict | None = None, options: dict | None = None) -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        title="Klassfan",
        unique_id=MAIN,
        data={"name": "Klassfan", "fan_entity": MAIN, "fallback_fan_entity": BACKUP, **(data or {})},
        options=options or {},
    )


async def setup_entry(hass, entry: MockConfigEntry) -> MockConfigEntry:
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


@pytest.fixture
def patch_services():
    """Return a function that starts recording every service call (and runs none)."""
    patchers = []

    def start() -> AsyncMock:
        patcher = patch("homeassistant.core.ServiceRegistry.async_call", new_callable=AsyncMock)
        patchers.append(patcher)
        return patcher.start()

    yield start
    for patcher in patchers:
        patcher.stop()
