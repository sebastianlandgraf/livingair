"""Livingair fault binary sensors."""

from __future__ import annotations

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .coordinator import LivingAirCoordinator
from .entity import LivingAirEntity

FAULT_NAMES = {
    "fault_humidity_sensor": "Humidity sensor fault",
    "fault_co2_sensor": "CO2 sensor fault",
    "fault_outdoor_frost": "Outdoor frost fault",
    "fault_supply_temperature": "Supply temperature fault",
    "fault_outdoor_sensor": "Outdoor sensor fault",
    "fault_supply_sensor": "Supply sensor fault",
    "fault_control_terminal": "Control terminal fault",
    "fault_fireplace": "Fireplace fault",
    "fault_smoke_detector": "Smoke detector fault",
    "fault_cover_switch": "Cover switch fault",
    "fault_filter": "Filter fault",
}


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities
) -> None:
    """Set up Livingair fault sensors."""
    coordinator: LivingAirCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        LivingAirFaultSensor(coordinator, entry.data["unit_ip"], key, name)
        for key, name in FAULT_NAMES.items()
    )


class LivingAirFaultSensor(LivingAirEntity, BinarySensorEntity):
    """Report one controller fault state."""

    _attr_device_class = BinarySensorDeviceClass.PROBLEM

    def __init__(
        self,
        coordinator: LivingAirCoordinator,
        unit_ip: str,
        key: str,
        name: str,
    ) -> None:
        super().__init__(coordinator, unit_ip, key)
        self._key = key
        self._attr_name = name

    @property
    def is_on(self) -> bool:
        return bool(self.coordinator.data[self._key])
