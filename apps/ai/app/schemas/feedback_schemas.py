from pydantic import BaseModel, Field


class FeedbackItemInput(BaseModel):
    pin_number: int
    x_pos: float
    y_pos: float
    content: str
    author_type: str
    page_number: int | None = None


class RevisionTask(BaseModel):
    action: str
    impact: str = Field(pattern=r"^(high|medium|low)$")
    source_pin: int
    contradiction: bool = False
    conflict_explanation: str | None = None


class FeedbackSummaryResult(BaseModel):
    tasks: list[RevisionTask] = []
    overall_notes: str = ""
