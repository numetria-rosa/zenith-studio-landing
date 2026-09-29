import json
from types import SimpleNamespace

import httpx
import pytest

from agents.booking_agent.agent import TOOLS, BookingAgent
from agents.booking_agent.calcom import BOOKINGS_VERSION, SLOTS_VERSION, CalComClient, flatten_slots
from core.llm import AnthropicLLM, FakeLLM, model_spec


class Cal:
    def __init__(self):
        self.booked = []

    def slots(self, event_type_id, start_utc, end_utc):
        return ["2026-10-05T14:00:00Z", "2026-10-05T15:00:00Z"]

    def book(self, event_type_id, start, name, email, time_zone, metadata=None):
        self.booked.append((start, email))
        return {"uid": f"uid{len(self.booked)}", "start": start, "status": "accepted"}


def agent(client, cal=None):
    return BookingAgent(client, FakeLLM(), cal or Cal())  # type: ignore[arg-type]


def test_cannot_book_a_time_that_was_never_offered(client):
    a = agent(client)
    with pytest.raises(ValueError, match="not offered"):
        a.book_slot({"start": "2026-10-05T14:00:00Z", "name": "Sam", "email": "s@x.co", "time_zone": "UTC"})


def test_double_call_creates_one_booking(client):
    cal = Cal()
    a = agent(client, cal)
    a.check_availability({"start_utc": "2026-10-05T00:00:00Z", "end_utc": "2026-10-06T00:00:00Z"})
    args = {"start": "2026-10-05T14:00:00Z", "name": "Sam", "email": "S@x.co", "time_zone": "UTC"}
    first, second = a.book_slot(args), a.book_slot({**args, "email": "s@x.co"})
    assert len(cal.booked) == 1 and second["duplicate"] and first["uid"] == second["uid"]


def test_tool_schemas_are_strict():
    for t in TOOLS:
        s = t["input_schema"]
        assert t["strict"] is True and s["additionalProperties"] is False and set(s["required"]) == set(s["properties"])


def test_calcom_client_sends_documented_versions_and_shape():
    seen = []

    def handler(req: httpx.Request):
        seen.append((req.method, req.url.path, req.headers["cal-api-version"], req.headers["authorization"]))
        if req.url.path == "/v2/slots":
            assert req.url.params["eventTypeId"] == "9"
            return httpx.Response(200, json={"status": "success", "data": {"2026-10-05": [{"start": "2026-10-05T15:00:00Z"}, {"start": "2026-10-05T14:00:00Z"}]}})
        body = json.loads(req.content)
        assert body["attendee"] == {"name": "Sam", "email": "s@x.co", "timeZone": "UTC"} and body["eventTypeId"] == 9
        return httpx.Response(201, json={"status": "success", "data": {"uid": "u1", "start": body["start"]}})

    cal = CalComClient("cal_key", httpx.Client(transport=httpx.MockTransport(handler)))
    assert cal.slots(9, "2026-10-05T00:00:00Z", "2026-10-06T00:00:00Z") == ["2026-10-05T14:00:00Z", "2026-10-05T15:00:00Z"]
    assert cal.book(9, "2026-10-05T14:00:00Z", "Sam", "s@x.co", "UTC")["uid"] == "u1"
    assert seen[0][2:] == (SLOTS_VERSION, "Bearer cal_key") and seen[1][2] == BOOKINGS_VERSION
    with pytest.raises(ValueError):
        cal.book(9, "not-a-time", "Sam", "s@x.co", "UTC")


def test_flatten_slots_sorts_across_days():
    assert flatten_slots({"2026-10-06": [{"start": "b"}], "2026-10-05": [{"start": "a"}]}) == ["a", "b"]


# --- the bounded tool loop, against a scripted stand-in for the Anthropic client ---------------------
def block_text(t):
    return SimpleNamespace(type="text", text=t)


def block_tool(id_, tool_name, **inp):
    return SimpleNamespace(type="tool_use", id=id_, name=tool_name, input=inp)


def response(content, stop):
    return SimpleNamespace(content=content, stop_reason=stop, usage=SimpleNamespace(input_tokens=1, output_tokens=1))


class Scripted:
    def __init__(self, *responses):
        self.responses, self.calls = list(responses), []
        self.messages = SimpleNamespace(create=self._create)

    def _create(self, **kw):
        self.calls.append(json.loads(json.dumps(kw["messages"], default=lambda o: "block")))
        return self.responses.pop(0)


def test_tool_loop_runs_tools_and_returns_all_results_in_one_message(client):
    cal = Cal()
    sdk = Scripted(
        response([block_tool("t1", "check_availability", start_utc="2026-10-05T00:00:00Z", end_utc="2026-10-06T00:00:00Z")], "tool_use"),
        response(
            [
                block_tool("t2", "book_slot", start="2026-10-05T14:00:00Z", name="Sam", email="s@x.co", time_zone="UTC"),
                block_tool("t3", "book_slot", start="2026-10-05T14:00:00Z", name="Sam", email="s@x.co", time_zone="UTC"),
            ],
            "tool_use",
        ),
        response([block_text("Booked for 14:00 UTC.")], "end_turn"),
    )
    a = BookingAgent(client, AnthropicLLM(model_spec("claude-sonnet-5-5"), sdk), cal)  # type: ignore[arg-type]
    out = a.reply([{"role": "user", "content": "book me tomorrow 2pm"}])
    assert out.text == "Booked for 14:00 UTC." and len(cal.booked) == 1
    last_user = sdk.calls[2][-1]
    assert last_user["role"] == "user" and len(last_user["content"]) == 2  # both tool_results in a single message


def test_tool_loop_stops_at_max_steps(client):
    forever = response([block_tool("t", "check_availability", start_utc="a", end_utc="b")], "tool_use")
    sdk = Scripted(*[forever] * 10)
    a = BookingAgent(client, AnthropicLLM(model_spec("claude-sonnet-5-5"), sdk), Cal(), max_steps=3)  # type: ignore[arg-type]
    out = a.reply([{"role": "user", "content": "x"}])
    assert out.stop_reason == "max_steps" and len(sdk.calls) == 3


def test_a_failing_tool_is_reported_to_the_model_not_raised(client):
    sdk = Scripted(
        response([block_tool("t1", "book_slot", start="2026-10-05T14:00:00Z", name="S", email="s@x.co", time_zone="UTC")], "tool_use"),
        response([block_text("Let me check availability first.")], "end_turn"),
    )
    a = BookingAgent(client, AnthropicLLM(model_spec("claude-sonnet-5-5"), sdk), Cal(), max_steps=3)  # type: ignore[arg-type]
    assert "check availability" in a.reply([{"role": "user", "content": "book"}]).text
    assert sdk.calls[1][-1]["content"][0]["is_error"] is True
