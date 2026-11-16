"""Livingair switch entities."""

from __future__ import annotations

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .coordinator import LivingAirCoordinator
from .entity import LivingAirEntity

SWITCHES = {
    "automatic": ("Automatic mode", 16934, "int"),
    "night_ventilation": ("Night ventilation", 16534, "int"),
    "occupied": ("Occupied", 16941, "uint"),
}


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities
) -> None:
    """Set up Livingair switches."""
    coordinator: LivingAirCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        LivingAirSwitch(coordinator, entry.data["unit_ip"], key, *config)
        for key, config in SWITCHES.items()
    )


class LivingAirSwitch(LivingAirEntity, SwitchEntity):
    """A writable Livingair boolean datapoint."""

    def __init__(
        self,
        coordinator: LivingAirCoordinator,
        unit_ip: str,
        key: str,
        name: str,
        address: int,
        kind: str,
    ) -> None:
        super().__init__(coordinator, unit_ip, key)
        self._key = key
        self._address = address
        self._kind = kind
        self._attr_name = name

    @property
    def is_on(self) -> bool:
        return bool(self.coordinator.data[self._key])

    async def async_turn_on(self, **kwargs) -> None:
        await self.coordinator.api.async_write(
            self._address, self._kind, 1, 2
        )
        await self.coordinator.async_request_refresh()

    async def async_turn_off(self, **kwargs) -> None:
        await self.coordinator.api.async_write(
            self._address, self._kind, 0, 2
        )
        await self.coordinator.async_request_refresh()
