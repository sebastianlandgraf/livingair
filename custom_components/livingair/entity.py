"""Common entity behavior for Livingair."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, MANUFACTURER, MODEL
from .coordinator import LivingAirCoordinator


class LivingAirEntity(CoordinatorEntity[LivingAirCoordinator]):
    """Base entity for a Livingair unit."""

    _attr_has_entity_name = True

    def __init__(
        self, coordinator: LivingAirCoordinator, unit_ip: str, key: str
    ) -> None:
        super().__init__(coordinator, context=key)
        self._key = key
        self._attr_unique_id = f"{unit_ip}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, unit_ip)},
            manufacturer=MANUFACTURER,
            model=MODEL,
            name=f"Livingair ({unit_ip})",
        )

    @property
    def value(self) -> object:
        """Return the latest value for this entity."""
        return self.coordinator.data[self._key]
