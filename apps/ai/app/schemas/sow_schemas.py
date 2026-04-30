from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class SowClauseOutput(BaseModel):
    clause_type: Literal[
        "deliverable", "revision_limit", "timeline", "exclusion",
        "payment_term", "acceptance_criteria", "other"
    ]
    # v1 compatibility: original_text maps to raw_text_source when content is absent
    original_text: Optional[str] = None
    # v2 fields
    content: Optional[str] = None
    summary: Optional[str] = None
    section_reference: Optional[str] = None
    confidence_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    confidence_level: Optional[Literal["high", "medium", "low"]] = None
    raw_text_source: Optional[str] = None
    page_number: Optional[int] = None
    requires_human_review: bool = False

    @property
    def resolved_original_text(self) -> str:
        """Return the best available text for the originalText DB column."""
        return self.content or self.original_text or ""


class SowParsingInput(BaseModel):
    sow_id: str
    project_id: str
    raw_text: str


class SowParsingResult(BaseModel):
    sow_id: str
    clauses: List[SowClauseOutput]
    clause_count: int
    document_summary: Optional[str] = None
    overall_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    extraction_warnings: List[str] = []
