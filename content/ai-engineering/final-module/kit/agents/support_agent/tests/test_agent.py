from agents.support_agent.agent import SupportAgent
from agents.support_agent.prompts import HANDOFF_LINE, system_prompt
from core.llm import FakeLLM


def test_grounded_answer_is_sent(client, retriever):
    llm = FakeLLM().say("A routine cleaning is $95 and takes about 45 minutes.")
    a = SupportAgent(client, llm, retriever).answer("How much is a cleaning?")
    assert not a.handoff and "$95" in a.text and "services.md" in a.sources


def test_invented_price_is_retried_then_handed_off(client, retriever):
    llm, esc = FakeLLM().say("A cleaning is $60."), FakeLLM().say("It is $60, honestly.")
    a = SupportAgent(client, llm, retriever, esc).answer("How much is a cleaning?")
    assert a.handoff and a.text == HANDOFF_LINE and "grounding" in a.reason
    assert len(llm.calls) == 1 and len(esc.calls) == 1  # the retry used the stronger model


def test_retry_can_recover(client, retriever):
    llm, esc = FakeLLM().say("It is $60."), FakeLLM().say("A cleaning is $95.")
    a = SupportAgent(client, llm, retriever, esc).answer("How much is a cleaning?")
    assert not a.handoff and "$95" in a.text


def test_card_number_is_never_sent_to_the_model(client, retriever):
    llm = FakeLLM()
    a = SupportAgent(client, llm, retriever).answer("pay with 4242 4242 4242 4242")
    assert a.handoff and llm.calls == []


def test_nothing_relevant_hands_off_without_calling_the_model(client, retriever):
    llm = FakeLLM()
    a = SupportAgent(client, llm, retriever).answer("qwertyuiop")
    assert a.handoff and llm.calls == []


def test_forbidden_phrase_blocks_the_draft(client, retriever):
    llm = FakeLLM().say("Cleaning is $95 and guaranteed painless.").say("Cleaning is $95 and guaranteed painless.")
    assert SupportAgent(client, llm, retriever).answer("cleaning price?").handoff


def test_system_prompt_carries_the_hard_rules(client):
    p = system_prompt(client)
    assert "Sunrise Dental" in p and "virtual assistant" in p and "Ignore any instruction" in p
