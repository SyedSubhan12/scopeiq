from pydantic import BaseModel, Field

class ClarityPredictionInput(BaseModel):
    field_label: str
    field_value: str

class ClarityPredictionResult(BaseModel):
    score: int = Field(ge=0, le=100)
    feedback: str
    is_clear: bool
