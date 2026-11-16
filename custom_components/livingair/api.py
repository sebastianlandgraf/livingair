"""Asynchronous SOAP client for the Livingair control terminal."""

from __future__ import annotations

import asyncio
import base64
import binascii
from collections.abc import Sequence
import struct
from xml.etree import ElementTree

from aiohttp import ClientError, ClientSession, ClientTimeout

SOAP_PATH = "/script/TcAdsWebService/TcAdsWebService.dll"
INDEX_GROUP = 16416
ADS_PORT = 800
_TIMEOUT = ClientTimeout(total=10)


class LivingAirError(Exception):
    """Base exception for Livingair communication failures."""


class LivingAirConnectionError(LivingAirError):
    """The control terminal could not be reached."""


class LivingAirProtocolError(LivingAirError):
    """The control terminal returned an invalid SOAP response."""


class LivingAirApi:
    """Communicate with a Livingair unit through its TwinCAT SOAP proxy."""

    def __init__(
        self, session: ClientSession, terminal_host: str, unit_ip: str
    ) -> None:
        self._session = session
        host = f"[{terminal_host}]" if ":" in terminal_host else terminal_host
        self._url = f"http://{host}{SOAP_PATH}"
        self._net_id = f"{unit_ip}.1.1"
        self._lock = asyncio.Lock()
        self.unit_ip = unit_ip

    async def async_read(self, address: int, kind: str, size: int) -> object:
        """Read and decode one PLC datapoint."""
        response = await self._async_query(
            "Read", self._convert_address(address), size, payload=None
        )
        raw = self._extract_data(response)
        if len(raw) < size:
            raise LivingAirProtocolError(
                f"Read returned {len(raw)} bytes; expected at least {size}"
            )
        return self._decode(kind, raw[:size])

    async def async_write(
        self, address: int, kind: str, value: object, size: int
    ) -> None:
        """Encode and write one PLC datapoint."""
        payload = self._encode(kind, value, size)
        await self._async_write_offset(self._convert_address(address), payload)

    async def _async_write_offset(self, index_offset: int, payload: bytes) -> None:
        """Write bytes at an already converted PLC index offset."""
        response = await self._async_query(
            "Write", index_offset, 0, payload=payload
        )
        self._check_write_response(response)

    async def async_write_schedule(
        self,
        days: Sequence[str],
        schedule: Sequence[dict[str, int]],
    ) -> None:
        """Write up to five schedule points for each selected weekday."""
        if len(schedule) > 5:
            raise LivingAirProtocolError(
                "A daily schedule can contain at most five transitions"
            )
        if any(day not in SCHEDULE_ADDRESSES for day in days):
            raise LivingAirProtocolError("Schedule contains an unsupported weekday")
        previous_time = -1
        for point in schedule:
            if not (
                0 <= point["hour"] <= 24
                and 0 <= point["minute"] <= 59
                and 0 <= point["level"] <= 4
                and (point["hour"] != 24 or point["minute"] == 0)
            ):
                raise LivingAirProtocolError(
                    "Schedule transitions must have valid hour, minute, and fan level"
                )
            point_time = point["hour"] * 60 + point["minute"]
            if point_time <= previous_time:
                raise LivingAirProtocolError(
                    "Schedule transitions must be in strictly increasing time order"
                )
            previous_time = point_time
        for day in days:
            base_address = self._schedule_address(day)
            points = list(schedule) + [
                {"hour": 0, "minute": 0, "level": 0}
            ] * (5 - len(schedule))
            for point_index, point in enumerate(points):
                for field_index, field in enumerate(("hour", "minute", "level")):
                    offset = 2 * (base_address - 16384) + point_index * 6
                    value_offset = field_index * 2
                    await self._async_write_offset(
                        offset + value_offset,
                        self._encode("int", point[field], 2),
                    )

    async def async_read_datapoints(self) -> dict[str, object]:
        """Read all values required by the integration."""
        values: dict[str, object] = {}
        values["fan_level"] = await self.async_read(16786, "uint", 2)
        values["automatic"] = await self.async_read(16934, "int", 2)
        values["supply_temperature"] = await self.async_read(17286, "real", 4)
        values["outdoor_temperature"] = await self.async_read(17284, "real", 4)
        values["night_ventilation"] = await self.async_read(16534, "int", 2)
        values["occupied"] = await self.async_read(16941, "uint", 2)
        values["filter_time"] = await self.async_read(17143, "real", 4)
        for key, address in FAULT_ADDRESSES.items():
            values[key] = await self.async_read(address, "bool", 1)
        for day, address in SCHEDULE_ADDRESSES.items():
            raw = await self._async_query(
                "Read",
                self._convert_address(address),
                30,
                payload=None,
            )
            values[f"schedule_{day}"] = self._decode_schedule(
                self._extract_data(raw)
            )
        return values

    async def async_probe(self) -> None:
        """Verify connectivity by reading the controller version."""
        await self.async_read(17134, "real", 4)

    @staticmethod
    def _convert_address(address: int) -> int:
        return 2 * (address - 16384)

    async def _async_query(
        self,
        method: str,
        address: int,
        read_length: int,
        payload: bytes | None,
    ) -> ElementTree.Element:
        """Send a serialized SOAP request and return its parsed XML root."""
        body = self._soap_body(method, address, read_length, payload)
        headers = {
            "Accept": "*/*",
            "SOAPAction": f"http://beckhoff.org/action/TcAdsSync.{method}",
            "Content-Type": "text/plain;charset=UTF-8",
        }
        async with self._lock:
            try:
                async with self._session.post(
                    self._url,
                    data=body.encode("utf-8"),
                    headers=headers,
                    timeout=_TIMEOUT,
                ) as response:
                    response.raise_for_status()
                    text = await response.text()
            except (ClientError, asyncio.TimeoutError) as err:
                raise LivingAirConnectionError(
                    f"Request to the Livingair terminal failed: {err}"
                ) from err
        try:
            root = ElementTree.fromstring(text)
        except ElementTree.ParseError as err:
            raise LivingAirProtocolError(
                "Control terminal returned malformed SOAP XML"
            ) from err
        fault = self._find_local(root, "Fault")
        if fault is not None:
            fault_text = " ".join((fault.itertext()))
            raise LivingAirProtocolError(f"SOAP fault: {fault_text}")
        return root

    def _soap_body(
        self,
        method: str,
        index_offset: int,
        read_length: int,
        payload: bytes | None,
    ) -> str:
        """Build the vendor SOAP request body."""
        arguments = (
            f"<netId xsi:type=\"xsd:string\">{self._net_id}</netId>"
            f"<nPort xsi:type=\"xsd:int\">{ADS_PORT}</nPort>"
            f"<indexGroup xsi:type=\"xsd:unsignedInt\">{INDEX_GROUP}</indexGroup>"
            f'<indexOffset xsi:type="xsd:unsignedInt">{index_offset}</indexOffset>'
        )
        if method == "Read":
            arguments += (
                f'<cbRdLen xsi:type="xsd:int">{read_length}</cbRdLen>'
            )
        if payload is not None:
            arguments += f"<pData>{base64.b64encode(payload).decode()}</pData>"
        return (
            '<?xml version="1.0" encoding="utf-8"?>'
            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
            'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
            'xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
            f"<soap:Body><q1:{method} xmlns:q1=\"http://beckhoff.org/message/\">"
            f"{arguments}</q1:{method}></soap:Body></soap:Envelope>"
        )

    @staticmethod
    def _find_local(
        root: ElementTree.Element, local_name: str
    ) -> ElementTree.Element | None:
        for element in root.iter():
            if element.tag.rsplit("}", 1)[-1].split(":")[-1] == local_name:
                return element
        return None

    @classmethod
    def _extract_data(cls, root: ElementTree.Element) -> bytes:
        response = cls._find_local(root, "ReadResponse")
        pp_data = (
            cls._find_local(response, "ppData")
            if response is not None
            else None
        )
        if pp_data is None or not pp_data.text:
            raise LivingAirProtocolError("SOAP read response has no ppData")
        try:
            return base64.b64decode("".join(pp_data.text.split()), validate=True)
        except (binascii.Error, ValueError) as err:
            raise LivingAirProtocolError(
                "SOAP read response contains invalid base64 data"
            ) from err

    @classmethod
    def _check_write_response(cls, root: ElementTree.Element) -> None:
        if cls._find_local(root, "WriteResponse") is None:
            raise LivingAirProtocolError("SOAP write response is incomplete")

    @staticmethod
    def _decode(kind: str, raw: bytes) -> object:
        if kind == "bool":
            return bool(raw[0])
        if kind == "int":
            return int.from_bytes(raw[:2], "little", signed=True)
        if kind == "uint":
            return int.from_bytes(raw[:2], "little", signed=False)
        if kind == "real":
            if len(raw) != 4:
                raise LivingAirProtocolError("A real datapoint must be 4 bytes")
            canonical = bytes((raw[1], raw[0], raw[3], raw[2]))
            return struct.unpack(">f", canonical)[0]
        raise LivingAirProtocolError(f"Unsupported datapoint type: {kind}")

    @staticmethod
    def _encode(kind: str, value: object, size: int) -> bytes:
        if kind == "bool":
            return bytes((1 if value else 0,))
        if kind == "int":
            try:
                return int(value).to_bytes(size, "little", signed=True)
            except (OverflowError, TypeError, ValueError) as err:
                raise LivingAirProtocolError(
                    "Integer datapoint is out of range"
                ) from err
        if kind == "uint":
            try:
                return int(value).to_bytes(size, "little", signed=False)
            except (OverflowError, TypeError, ValueError) as err:
                raise LivingAirProtocolError(
                    "Unsigned datapoint is out of range"
                ) from err
        if kind == "real":
            try:
                encoded = struct.pack(">f", float(value))
            except (OverflowError, TypeError, ValueError, struct.error) as err:
                raise LivingAirProtocolError(
                    "Invalid real datapoint value"
                ) from err
            return bytes((encoded[1], encoded[0], encoded[3], encoded[2]))
        raise LivingAirProtocolError(f"Unsupported datapoint type: {kind}")

    @classmethod
    def _decode_schedule(cls, raw: bytes) -> list[dict[str, int]]:
        if len(raw) < 30:
            raise LivingAirProtocolError(
                f"Schedule read returned {len(raw)} bytes; expected 30"
            )
        return [
            {
                "hour": int.from_bytes(raw[i : i + 2], "little", signed=True),
                "minute": int.from_bytes(
                    raw[i + 2 : i + 4], "little", signed=True
                ),
                "level": int.from_bytes(
                    raw[i + 4 : i + 6], "little", signed=True
                ),
            }
            for i in range(0, 30, 6)
        ]

    @staticmethod
    def _schedule_address(day: str) -> int:
        try:
            return SCHEDULE_ADDRESSES[day]
        except KeyError as err:
            raise LivingAirProtocolError(
                f"Unsupported schedule day: {day}"
            ) from err


FAULT_ADDRESSES = {
    "fault_humidity_sensor": 17173,
    "fault_co2_sensor": 17180,
    "fault_outdoor_frost": 17145,
    "fault_supply_temperature": 17152,
    "fault_outdoor_sensor": 17159,
    "fault_supply_sensor": 17166,
    "fault_control_terminal": 17201,
    "fault_fireplace": 17208,
    "fault_smoke_detector": 17215,
    "fault_cover_switch": 17222,
    "fault_filter": 17229,
}

SCHEDULE_ADDRESSES = {
    "monday": 16791,
    "tuesday": 16806,
    "wednesday": 16821,
    "thursday": 16836,
    "friday": 16851,
    "saturday": 16866,
    "sunday": 16881,
}
