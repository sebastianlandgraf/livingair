"""Focused tests for Livingair protocol encoding."""

import base64
import unittest

from custom_components.livingair.api import LivingAirApi, LivingAirProtocolError


class FakeResponse:
    """Minimal aiohttp response context used by API request tests."""

    def __init__(self, body: str) -> None:
        self._body = body

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args) -> None:
        return None

    def raise_for_status(self) -> None:
        return None

    async def text(self) -> str:
        return self._body


class FakeSession:
    """Capture outgoing API calls and return a fixed SOAP response."""

    def __init__(self, body: str) -> None:
        self.body = body
        self.calls: list[tuple[str, dict[str, object]]] = []

    def post(self, url: str, **kwargs) -> FakeResponse:
        self.calls.append((url, kwargs))
        return FakeResponse(self.body)


class LivingAirCodecTests(unittest.IsolatedAsyncioTestCase):
    """Verify wire byte order and PLC datapoint conversions."""

    def test_numeric_decoding_uses_little_endian_words(self) -> None:
        self.assertEqual(LivingAirApi._decode("int", b"\xff\xff"), -1)
        self.assertEqual(LivingAirApi._decode("uint", b"\xff\xff"), 65535)

    def test_real_encoding_round_trips_controller_byte_order(self) -> None:
        encoded = LivingAirApi._encode("real", 1.0, 4)
        self.assertEqual(encoded, b"\x80\x3f\x00\x00")
        self.assertEqual(LivingAirApi._decode("real", encoded), 1.0)

    def test_bool_decodes_the_single_byte_value(self) -> None:
        self.assertFalse(LivingAirApi._decode("bool", b"\x00"))
        self.assertTrue(LivingAirApi._decode("bool", b"\x01"))

    def test_address_conversion_matches_existing_client(self) -> None:
        self.assertEqual(LivingAirApi._convert_address(16786), 804)

    async def test_schedule_rejects_more_than_five_transitions(self) -> None:
        transitions = [{"hour": 1, "minute": 0, "level": 1}] * 6
        api = LivingAirApi(None, "192.0.2.1", "192.0.2.2")
        with self.assertRaises(LivingAirProtocolError):
            await api.async_write_schedule(["monday"], transitions)

    async def test_schedule_rejects_out_of_order_transitions(self) -> None:
        transitions = [
            {"hour": 10, "minute": 0, "level": 1},
            {"hour": 9, "minute": 0, "level": 2},
        ]
        api = LivingAirApi(None, "192.0.2.1", "192.0.2.2")
        with self.assertRaises(LivingAirProtocolError):
            await api.async_write_schedule(["monday"], transitions)

    def test_schedule_decoding_reads_five_little_endian_points(self) -> None:
        raw = b"".join(
            value.to_bytes(2, "little", signed=True)
            for value in (6, 30, 2, 22, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        )
        self.assertEqual(
            LivingAirApi._decode_schedule(raw)[:2],
            [
                {"hour": 6, "minute": 30, "level": 2},
                {"hour": 22, "minute": 0, "level": 1},
            ],
        )

class LivingAirRequestTests(unittest.IsolatedAsyncioTestCase):
    """Verify SOAP addressing and write payload construction."""

    async def test_read_uses_converted_offset_and_decodes_payload(self) -> None:
        payload = base64.b64encode(b"\x80\x3f\x00\x00").decode()
        session = FakeSession(
            "<s:Envelope xmlns:s='urn:soap'><s:Body><ReadResponse>"
            f"<ppData>{payload}</ppData>"
            "</ReadResponse></s:Body></s:Envelope>"
        )
        api = LivingAirApi(session, "192.0.2.1", "192.0.2.2")

        result = await api.async_read(16786, "real", 4)

        self.assertEqual(result, 1.0)
        url, request = session.calls[0]
        self.assertEqual(
            url,
            "http://192.0.2.1/script/TcAdsWebService/TcAdsWebService.dll",
        )
        self.assertIn(
            "<indexOffset xsi:type=\"xsd:unsignedInt\">804</indexOffset>",
            request["data"].decode(),
        )

    async def test_schedule_writes_each_field_at_the_plc_offset(self) -> None:
        session = FakeSession(
            "<s:Envelope xmlns:s='urn:soap'><s:Body>"
            "<WriteResponse />"
            "</s:Body></s:Envelope>"
        )
        api = LivingAirApi(session, "192.0.2.1", "192.0.2.2")

        await api.async_write_schedule(
            ["monday"], [{"hour": 6, "minute": 30, "level": 2}]
        )

        self.assertEqual(len(session.calls), 15)
        first_request = session.calls[0][1]["data"].decode()
        self.assertIn(
            "<indexOffset xsi:type=\"xsd:unsignedInt\">814</indexOffset>",
            first_request,
        )
        self.assertIn("<pData>BgA=</pData>", first_request)


if __name__ == "__main__":
    unittest.main()
