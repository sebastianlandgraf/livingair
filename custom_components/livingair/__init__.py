"""Home Assistant integration for Brötje Livingair units."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
import voluptuous as vol

from .const import DOMAIN, PLATFORMS, SCHEDULE_DAYS
from .coordinator import LivingAirCoordinator

SERVICE_SET_SCHEDULE = "set_schedule"
SERVICE_SET_SCHEDULE_SCHEMA = vol.Schema(
    {
        vol.Required("unit_ip"): str,
        vol.Required("days"): vol.All(
            [vol.In(SCHEDULE_DAYS)], vol.Length(min=1, max=7)
        ),
        vol.Required("schedule"): vol.All(
            [
                vol.Schema(
                    {
                        vol.Required("hour"): vol.All(
                            vol.Coerce(int), vol.Range(min=0, max=24)
                        ),
                        vol.Required("minute"): vol.All(
                            vol.Coerce(int), vol.Range(min=0, max=59)
                        ),
                        vol.Required("level"): vol.All(
                            vol.Coerce(int), vol.Range(min=0, max=4)
                        ),
                    }
                )
            ],
            vol.Length(max=5),
        ),
    }
)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the integration domain."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Livingair from a config entry."""
    coordinator = LivingAirCoordinator(
        hass,
        entry.data["terminal_host"],
        entry.data["unit_ip"],
    )
    await coordinator.async_config_entry_first_refresh()
    hass.data[DOMAIN][entry.entry_id] = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    if not hass.services.has_service(DOMAIN, SERVICE_SET_SCHEDULE):

        async def async_set_schedule(call: ServiceCall) -> None:
            """Set one or more weekday schedules."""
            target_entry = next(
                (
                    candidate
                    for candidate in hass.config_entries.async_entries(DOMAIN)
                    if candidate.data["unit_ip"] == call.data["unit_ip"]
                ),
                None,
            )
            target = (
                hass.data[DOMAIN].get(target_entry.entry_id)
                if target_entry is not None
                else None
            )
            if target is None:
                raise HomeAssistantError(
                    "No configured Livingair unit matches this IP address"
                )
            await target.api.async_write_schedule(
                call.data["days"], call.data["schedule"]
            )
            await target.async_request_refresh()

        hass.services.async_register(
            DOMAIN,
            SERVICE_SET_SCHEDULE,
            async_set_schedule,
            schema=SERVICE_SET_SCHEDULE_SCHEMA,
        )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a Livingair config entry."""
    if not await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        return False
    hass.data[DOMAIN].pop(entry.entry_id)
    if not hass.data[DOMAIN]:
        hass.services.async_remove(DOMAIN, SERVICE_SET_SCHEDULE)
    return True
