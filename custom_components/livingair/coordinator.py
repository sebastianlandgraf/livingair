"""Coordinator for Livingair polling."""

from __future__ import annotations

from datetime import timedelta
import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator,
    UpdateFailed,
)

from .api import LivingAirApi, LivingAirError
from .const import DEFAULT_SCAN_INTERVAL, DOMAIN

_LOGGER = logging.getLogger(__name__)


class LivingAirCoordinator(DataUpdateCoordinator[dict[str, object]]):
    """Poll a Livingair controller and expose its datapoints."""

    def __init__(
        self, hass: HomeAssistant, terminal_host: str, unit_ip: str
    ) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL),
        )
        self.api = LivingAirApi(
            async_get_clientsession(hass), terminal_host, unit_ip
        )

    async def _async_update_data(self) -> dict[str, object]:
        try:
            return await self.api.async_read_datapoints()
        except LivingAirError as err:
            raise UpdateFailed(f"Unable to update Livingair: {err}") from err
