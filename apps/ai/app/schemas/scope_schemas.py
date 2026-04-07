from pydantic import BaseModel, Field


class ScopeClauseInput(BaseModel):
    id: str
    clause_type: str
    summary: str | None = None
    original_text: str


class MatchingClause(BaseModel):
    clause_id: str
    clause_text: str
    relevance: float = Field(ge=0.0, le=1.0)


class ScopeAnalysisInput(BaseModel):
    project_id: str
    input_text: str
    clauses: list[ScopeClauseInput]


class ScopeAnalysisResult(BaseModel):
    is_in_scope: bool
    confidence: float = Field(ge=0.0, le=1.0)
    matching_clauses: list[MatchingClause] = Field(default_factory=list, max_length=3)
    severity: str = Field(pattern=r"^(low|medium|high)$", default="medium")
    suggested_response: str
    reasoning: str

    @property
    def is_deviation(self) -> bool:
        """Backward-compat: is_deviation = not is_in_scope."""
        return not self.is_in_scope

    @property
    def matched_clause_id(self) -> str | None:
        """Backward-compat: return first matching clause ID."""
        return self.matching_clauses[0].clause_id if self.matching_clauses else None

    @property
    def suggested_severity(self) -> str:
        """Backward-compat."""
        return self.severity
