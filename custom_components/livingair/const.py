"""Constants for the Livingair integration."""

from homeassistant.const import Platform

DOMAIN = "livingair"
MANUFACTURER = "Brötje"
MODEL = "Livingair LAK300"
DEFAULT_SCAN_INTERVAL = 30

PLATFORMS: tuple[Platform, ...] = (
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.FAN,
    Platform.SENSOR,
    Platform.SWITCH,
)

SCHEDULE_DAYS = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)

SCHEDULE_ADDRESSES = {
    day: address
    for day, address in zip(
        SCHEDULE_DAYS,
        (16791, 16806, 16821, 16836, 16851, 16866, 16881),
        strict=True,
    )
}
