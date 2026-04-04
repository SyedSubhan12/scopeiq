from pydantic import BaseModel, Field


class BriefFieldInput(BaseModel):
    field_key: str
    field_type: str
    label: str
    value: str | None = None


class BriefFlag(BaseModel):
    field_key: str
    reason: str
    severity: str = Field(pattern=r"^(low|medium|high)$")
    suggested_question: str


class BriefScoreResult(BaseModel):
    score: int = Field(ge=0, le=100)
    summary: str
    flags: list[BriefFlag] = []
