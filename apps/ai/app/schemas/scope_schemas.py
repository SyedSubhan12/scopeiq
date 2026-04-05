from pydantic import BaseModel, Field

class ScopeClauseInput(BaseModel):
    id: str
    clause_type: str
    summary: str | None = None
    original_text: str

class ScopeAnalysisInput(BaseModel):
    project_id: str
    input_text: str
    clauses: list[ScopeClauseInput]

class ScopeAnalysisResult(BaseModel):
    is_deviation: bool
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    matched_clause_id: str | None = None
    suggested_severity: str = Field(pattern=r"^(low|medium|high)$", default="medium")
