"""Document types the extractor understands. Add a type = add a pydantic model and register it.

Deliberately absent: passports and ID documents. The kit never stores or processes them.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class LineItem(BaseModel):
    description: str
    quantity: float | None = None
    unit_price: float | None = None
    amount: float


class Invoice(BaseModel):
    vendor: str
    invoice_number: str | None = None
    issue_date: str | None = Field(default=None, description="YYYY-MM-DD")
    due_date: str | None = Field(default=None, description="YYYY-MM-DD")
    currency: str = Field(description="ISO 4217 code, e.g. USD")
    line_items: list[LineItem]
    subtotal: float | None = None
    tax: float | None = None
    total: float


class CoverageLine(BaseModel):
    coverage: str
    limit: str | None = None


class InsuranceCertificate(BaseModel):
    insured_name: str
    policy_number: str
    carrier: str
    effective_date: str = Field(description="YYYY-MM-DD")
    expiration_date: str = Field(description="YYYY-MM-DD")
    coverages: list[CoverageLine]


REGISTRY: dict[str, type[BaseModel]] = {"invoice": Invoice, "insurance_certificate": InsuranceCertificate}
