"""Livingair action buttons."""

from __future__ import annotations

import asyncio

from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .coordinator import LivingAirCoordinator
from .entity import LivingAirEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities
) -> None:
    """Set up Livingair action buttons."""
    coordinator: LivingAirCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        [
            LivingAirConfigurationRefresh(coordinator, entry.data["unit_ip"]),
            LivingAirFilterReset(coordinator, entry.data["unit_ip"]),
        ]
    )


class LivingAirConfigurationRefresh(LivingAirEntity, ButtonEntity):
    """Refresh the current configuration from the terminal."""

    _attr_name = "Get current configuration"

    def __init__(self, coordinator: LivingAirCoordinator, unit_ip: str) -> None:
        super().__init__(coordinator, unit_ip, "get_current_configuration")

    async def async_press(self) -> None:
        await self.coordinator.async_request_refresh()


class LivingAirFilterReset(LivingAirEntity, ButtonEntity):
    """Reset the controller's filter interval."""

    _attr_name = "Reset filter interval"

    def __init__(self, coordinator: LivingAirCoordinator, unit_ip: str) -> None:
        super().__init__(coordinator, unit_ip, "filter_reset")

    async def async_press(self) -> None:
        await self.coordinator.api.async_write(16938, "int", 1, 2)
        await asyncio.sleep(0.1)
        await self.coordinator.api.async_write(16938, "int", 0, 2)
        await self.coordinator.async_request_refresh()
