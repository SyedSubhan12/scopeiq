from pydantic import BaseModel
from typing import Any


class ChangeOrderLineItem(BaseModel):
    rate_card_item_id: str
    rate_card_name: str
    quantity: float
    unit: str
    rate_in_cents: int
    subtotal_cents: int


class ChangeOrderOutput(BaseModel):
    title: str
    description: str
    estimated_hours: float
    line_items: list[ChangeOrderLineItem]
    total_amount_cents: int
    revised_timeline: str | None = None
