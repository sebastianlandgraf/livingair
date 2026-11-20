"""Livingair fan entity."""

from __future__ import annotations

from homeassistant.components.fan import FanEntity, FanEntityFeature
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN
from .coordinator import LivingAirCoordinator
from .entity import LivingAirEntity

LEVEL_TO_PRESET = {
    1: "Level 1",
    2: "Level 2",
    3: "Level 3",
    4: "Level 4",
}
PRESET_TO_LEVEL = {preset: level for level, preset in LEVEL_TO_PRESET.items()}


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities
) -> None:
    """Set up the fan entity."""
    coordinator: LivingAirCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([LivingAirFan(coordinator, entry.data["unit_ip"])])


class LivingAirFan(LivingAirEntity, FanEntity):
    """Fan control for the Livingair ventilation unit."""

    _attr_name = "Ventilation"
    _attr_supported_features = FanEntityFeature.PRESET_MODE

    def __init__(self, coordinator: LivingAirCoordinator, unit_ip: str) -> None:
        super().__init__(coordinator, unit_ip, "fan_level")

    @property
    def is_on(self) -> bool:
        return int(self.coordinator.data["fan_level"]) > 0 or bool(
            self.coordinator.data["automatic"]
        )

    @property
    def preset_mode(self) -> str | None:
        if self.coordinator.data["automatic"]:
            return None
        level = int(self.coordinator.data["fan_level"])
        return LEVEL_TO_PRESET.get(level)

    @property
    def preset_modes(self) -> list[str]:
        return list(LEVEL_TO_PRESET.values())

    async def _async_set_level(self, level: int) -> None:
        await self.coordinator.api.async_write(16934, "int", 0, 2)
        await self.coordinator.api.async_write(16786, "uint", level, 2)
        await self.coordinator.async_request_refresh()

    async def async_set_preset_mode(self, preset_mode: str) -> None:
        if preset_mode not in PRESET_TO_LEVEL:
            raise HomeAssistantError(f"Unsupported fan preset: {preset_mode}")
        await self._async_set_level(PRESET_TO_LEVEL[preset_mode])

    async def async_turn_on(
        self, preset_mode: str | None = None, **kwargs
    ) -> None:
        await self.async_set_preset_mode(preset_mode or LEVEL_TO_PRESET[1])

    async def async_turn_off(self, **kwargs) -> None:
        await self._async_set_level(0)
