"""Config flow for Livingair."""

from __future__ import annotations

import ipaddress
import re

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import voluptuous as vol

from .api import LivingAirApi, LivingAirError
from .const import DOMAIN


def _validate_host(value: str) -> str:
    host = value.strip()
    if not host or any(char.isspace() for char in host):
        raise vol.Invalid("Enter a valid host name or IP address")
    try:
        ipaddress.ip_address(host)
    except ValueError:
        labels = host.rstrip(".").split(".")
        if len(host) > 253 or not all(
            re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?", label)
            for label in labels
        ):
            raise vol.Invalid("Enter a valid host name or IP address")
    return host


def _schema(defaults: dict[str, str] | None = None) -> vol.Schema:
    defaults = defaults or {}
    return vol.Schema(
        {
            vol.Required(
                "terminal_host", default=defaults.get("terminal_host", "")
            ): str,
            vol.Required("unit_ip", default=defaults.get("unit_ip", "")): str,
        }
    )


class LivingAirConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Configure a Livingair unit."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, str] | None = None
    ) -> FlowResult:
        """Handle the initial setup step."""
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                terminal_host = _validate_host(user_input["terminal_host"])
                unit_ip = str(
                    ipaddress.IPv4Address(user_input["unit_ip"].strip())
                )
                await self._async_validate_connection(terminal_host, unit_ip)
            except vol.Invalid:
                errors["terminal_host"] = "invalid_host"
            except ValueError:
                errors["unit_ip"] = "invalid_ip"
            except LivingAirError:
                errors["base"] = "cannot_connect"
            else:
                await self.async_set_unique_id(unit_ip)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=f"Livingair ({unit_ip})",
                    data={
                        "terminal_host": terminal_host,
                        "unit_ip": unit_ip,
                    },
                )
        return self.async_show_form(
            step_id="user", data_schema=_schema(user_input), errors=errors
        )

    async def _async_validate_connection(
        self, terminal_host: str, unit_ip: str
    ) -> None:
        """Probe the controller before saving configuration."""
        api = LivingAirApi(
            async_get_clientsession(self.hass), terminal_host, unit_ip
        )
        await api.async_probe()
