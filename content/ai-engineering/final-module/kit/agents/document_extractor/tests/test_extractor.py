import pytest

from agents.document_extractor.extractor import UnsupportedDocument, check_dates, check_invoice, extract
from agents.document_extractor.schemas import Invoice, LineItem
from core.llm import FakeLLM


def invoice(**kw):
    base = dict(vendor="Acme", currency="USD", line_items=[LineItem(description="a", amount=100), LineItem(description="b", amount=50)], subtotal=150, tax=15, total=165)
    return Invoice(**{**base, **kw})


def test_consistent_invoice_passes_review():
    assert check_invoice(invoice()) == []


def test_wrong_total_and_subtotal_are_flagged():
    assert "total says 170" in check_invoice(invoice(total=170))[0]
    assert "subtotal says 140" in check_invoice(invoice(subtotal=140, total=155))[0]


def test_date_checks():
    assert check_dates("2026-10-01", "2026-09-01") == ["due date is before the issue date"]
    assert check_dates("2026-10-01", "2026-10-31") == []
    assert check_dates("01/10/2026", "2026-10-31")  # wrong format is flagged


def test_extract_sends_pdf_first_and_flags_bad_math():
    llm = FakeLLM().say_object(invoice(total=999))
    result = extract(b"%PDF-1.4 fake", "invoice", llm)
    content = llm.calls[0]["messages"][0]["content"]
    assert content[0]["type"] == "document" and content[0]["source"]["media_type"] == "application/pdf" and content[1]["type"] == "text"
    assert result.needs_review and result.review_reasons


def test_clean_extraction_needs_no_review():
    assert not extract(b"%PDF", "invoice", FakeLLM().say_object(invoice())).needs_review


@pytest.mark.parametrize("bad", ["passport", "id_card", "driver_licence"])
def test_identity_documents_are_not_supported(bad):
    with pytest.raises(UnsupportedDocument):
        extract(b"%PDF", bad, FakeLLM())


def test_oversized_pdf_is_refused_before_any_model_call():
    llm = FakeLLM()
    with pytest.raises(UnsupportedDocument):
        extract(b"0" * (32 * 1024 * 1024 + 1), "invoice", llm)
    assert llm.calls == []
