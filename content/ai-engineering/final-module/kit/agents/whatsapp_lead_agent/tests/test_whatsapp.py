import hashlib
import hmac
import json

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from agents.whatsapp_lead_agent import api
from agents.whatsapp_lead_agent.agent import LeadAgent, LeadFields, Turn, lead_score
from agents.whatsapp_lead_agent.whatsapp import WhatsAppClient, WindowClosed, extract_inbound_text
from core.llm import FakeLLM

PAYLOAD = {
    "entry": [
        {
            "changes": [
                {
                    "field": "messages",
                    "value": {
                        "metadata": {"phone_number_id": "111"},
                        "contacts": [{"wa_id": "4477", "profile": {"name": "Sam"}}],
                        "messages": [
                            {"from": "4477", "id": "wamid.1", "timestamp": "1760000000", "type": "text", "text": {"body": "hi"}},
                            {"from": "4477", "id": "wamid.2", "timestamp": "1760000001", "type": "image"},
                        ],
                    },
                },
                {"field": "statuses", "value": {}},
            ]
        }
    ]
}


def sign(raw: bytes, secret="app-secret"):
    return "sha256=" + hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()


def test_extract_inbound_text_skips_other_types_and_unknown_shapes():
    msgs = extract_inbound_text(PAYLOAD)
    assert [(m.message_id, m.name, m.text) for m in msgs] == [("wamid.1", "Sam", "hi")]
    assert extract_inbound_text({"weird": 1}) == []


def test_window_enforced_and_template_allowed():
    sent = []

    def handler(req):
        sent.append(json.loads(req.content))
        return httpx.Response(200, json={"messages": [{"id": "wamid.out"}]})

    now = [1_000_000.0]
    wa = WhatsAppClient("111", "tok", httpx.Client(transport=httpx.MockTransport(handler)), now=lambda: now[0])
    with pytest.raises(WindowClosed):
        wa.send_text("4477", "hello")  # customer never wrote
    wa.note_inbound("4477")
    assert wa.send_text("4477", "hello") == "wamid.out"
    assert sent[0]["messaging_product"] == "whatsapp" and sent[0]["text"]["body"] == "hello"
    now[0] += 24 * 3600 + 1
    with pytest.raises(WindowClosed):
        wa.send_text("4477", "late")
    wa.send_template("4477", "appointment_followup", "en", ["Sam"])
    assert sent[1]["type"] == "template" and sent[1]["template"]["components"][0]["parameters"][0]["text"] == "Sam"


def _app(monkeypatch, replies):
    monkeypatch.setenv("WHATSAPP_APP_SECRET", "app-secret")
    monkeypatch.setenv("WHATSAPP_VERIFY_TOKEN", "vt")
    api._seen.__init__()
    outbox = []

    class Sender:
        def note_inbound(self, *a): ...

        def send_text(self, to, text):
            outbox.append((to, text))

    class Agent:
        def handle(self, customer, text):
            return replies

    api.agents["111"], api.senders["111"] = Agent(), Sender()
    app = FastAPI()
    app.include_router(api.router)
    return TestClient(app), outbox


def test_webhook_handshake(monkeypatch):
    c, _ = _app(monkeypatch, None)
    ok = c.get("/whatsapp/webhook", params={"hub.mode": "subscribe", "hub.verify_token": "vt", "hub.challenge": "42"})
    assert ok.status_code == 200 and ok.text == "42"
    assert c.get("/whatsapp/webhook", params={"hub.mode": "subscribe", "hub.verify_token": "no", "hub.challenge": "42"}).status_code == 403


def test_webhook_rejects_bad_signature_and_dedupes(monkeypatch):
    from agents.whatsapp_lead_agent.agent import Outcome

    c, outbox = _app(monkeypatch, Outcome("hello!", False, 0, LeadFields()))
    raw = json.dumps(PAYLOAD).encode()
    assert c.post("/whatsapp/webhook", content=raw, headers={"X-Hub-Signature-256": "sha256=bad"}).status_code == 401
    good = {"X-Hub-Signature-256": sign(raw)}
    assert c.post("/whatsapp/webhook", content=raw, headers=good).status_code == 200
    assert c.post("/whatsapp/webhook", content=raw, headers=good).status_code == 200  # Meta retry
    assert outbox == [("4477", "hello!")]  # handled exactly once


def test_agent_merges_lead_fields_and_scores_in_code(client, retriever):
    llm = FakeLLM()
    llm.say_object(Turn(reply="Welcome! What do you need?", lead=LeadFields(name="Sam", need="whitening"), intent="enquiry"))
    llm.say_object(Turn(reply="Great, and when?", lead=LeadFields(budget="$350"), intent="enquiry"))  # name/need omitted this turn
    agent = LeadAgent(client, llm, retriever)
    agent.handle("4477", "hi, I want whitening")
    out = agent.handle("4477", "around $350")
    assert out.lead.name == "Sam" and out.lead.need == "whitening" and out.lead.budget == "$350"
    assert out.score == lead_score(out.lead) == 2 and not out.handoff


def test_hot_lead_and_complaint_hand_off(client, retriever):
    llm = FakeLLM().say_object(
        Turn(reply="Thanks!", lead=LeadFields(need="x", budget="y", timeline="z"), intent="enquiry")
    ).say_object(Turn(reply="Sorry to hear that.", lead=LeadFields(), intent="complaint"))
    agent = LeadAgent(client, llm, retriever)
    assert agent.handle("a", "all three").handoff
    assert agent.handle("b", "this is terrible").handoff


def test_invented_price_in_reply_is_replaced(client, retriever):
    llm = FakeLLM().say_object(Turn(reply="Whitening is only $99!", lead=LeadFields(), intent="enquiry"))
    out = LeadAgent(client, llm, retriever).handle("a", "how much is whitening")
    assert "$99" not in out.reply and out.handoff


def test_card_number_never_reaches_the_model(client, retriever):
    llm = FakeLLM()
    out = LeadAgent(client, llm, retriever).handle("a", "4242 4242 4242 4242")
    assert out.handoff and llm.calls == []
