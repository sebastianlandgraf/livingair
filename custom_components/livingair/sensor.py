"""Livingair sensor entities."""

from __future__ import annotations

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfTemperature
from homeassistant.core import HomeAssistant

from .api import SCHEDULE_ADDRESSES
from .const import DOMAIN
from .coordinator import LivingAirCoordinator
from .entity import LivingAirEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities
) -> None:
    """Set up Livingair sensors."""
    coordinator: LivingAirCoordinator = hass.data[DOMAIN][entry.entry_id]
    entities: list[SensorEntity] = [
        LivingAirValueSensor(
            coordinator,
            entry.data["unit_ip"],
            "supply_temperature",
            "Supply air temperature",
            SensorDeviceClass.TEMPERATURE,
            UnitOfTemperature.CELSIUS,
        ),
        LivingAirValueSensor(
            coordinator,
            entry.data["unit_ip"],
            "outdoor_temperature",
            "Outdoor air temperature",
            SensorDeviceClass.TEMPERATURE,
            UnitOfTemperature.CELSIUS,
        ),
        LivingAirValueSensor(
            coordinator,
            entry.data["unit_ip"],
            "filter_time",
            "Remaining filter time",
        ),
    ]
    entities.extend(
        LivingAirScheduleSensor(coordinator, entry.data["unit_ip"], day)
        for day in SCHEDULE_ADDRESSES
    )
    async_add_entities(entities)


class LivingAirValueSensor(LivingAirEntity, SensorEntity):
    """A sensor backed by one Livingair datapoint."""

    def __init__(
        self,
        coordinator: LivingAirCoordinator,
        unit_ip: str,
        key: str,
        name: str,
        device_class: SensorDeviceClass | None = None,
        native_unit: str | None = None,
    ) -> None:
        super().__init__(coordinator, unit_ip, key)
        self._key = key
        self._attr_name = name
        self._attr_device_class = device_class
        self._attr_native_unit_of_measurement = native_unit
        self._attr_state_class = SensorStateClass.MEASUREMENT

    @property
    def native_value(self) -> object:
        return self.coordinator.data[self._key]


class LivingAirScheduleSensor(LivingAirEntity, SensorEntity):
    """Expose the configured daily schedule as sensor attributes."""

    _attr_name = None

    def __init__(
        self, coordinator: LivingAirCoordinator, unit_ip: str, day: str
    ) -> None:
        key = f"schedule_{day}"
        super().__init__(coordinator, unit_ip, key)
        self._day = day
        self._attr_translation_key = key

    @property
    def native_value(self) -> int:
        return sum(
            1
            for point in self.coordinator.data[self._key]
            if point["hour"] or point["minute"] or point["level"]
        )

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        return {"day": self._day, "transitions": self.coordinator.data[self._key]}
