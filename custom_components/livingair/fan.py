"""Livingair fan entity."""

from __future__ import annotations

from homeassistant.components.fan import FanEntity, FanEntityFeature
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .coordinator import LivingAirCoordinator
from .entity import LivingAirEntity

LEVELS = [0, 1, 2, 3, 4]
LEVEL_TO_PERCENTAGE = {0: 0, 1: 25, 2: 50, 3: 75, 4: 100}


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities
) -> None:
    """Set up the fan entity."""
    coordinator: LivingAirCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([LivingAirFan(coordinator, entry.data["unit_ip"])])


class LivingAirFan(LivingAirEntity, FanEntity):
    """Fan control for the Livingair ventilation unit."""

    _attr_name = "Ventilation"
    _attr_supported_features = FanEntityFeature.SET_SPEED

    def __init__(self, coordinator: LivingAirCoordinator, unit_ip: str) -> None:
        super().__init__(coordinator, unit_ip, "fan_level")

    @property
    def is_on(self) -> bool:
        return int(self.coordinator.data["fan_level"]) > 0 or bool(
            self.coordinator.data["automatic"]
        )

    @property
    def percentage(self) -> int:
        level = int(self.coordinator.data["fan_level"])
        return LEVEL_TO_PERCENTAGE.get(level, 0)

    async def async_set_percentage(self, percentage: int) -> None:
        level = min(
            LEVELS,
            key=lambda item: abs(LEVEL_TO_PERCENTAGE[item] - percentage),
        )
        await self.coordinator.api.async_write(16934, "int", 0, 2)
        await self.coordinator.api.async_write(16786, "uint", level, 2)
        await self.coordinator.async_request_refresh()

    async def async_turn_on(self, percentage: int | None = None, **kwargs) -> None:
        await self.async_set_percentage(
            percentage if percentage is not None else 25
        )

    async def async_turn_off(self, **kwargs) -> None:
        await self.async_set_percentage(0)
