from pydantic import BaseModel
from typing import Optional, List, Literal


class SowClauseOutput(BaseModel):
    clause_type: Literal["deliverable", "revision_limit", "timeline", "exclusion", "payment_term", "other"]
    original_text: str
    summary: str
    section_reference: Optional[str] = None


class SowParsingInput(BaseModel):
    sow_id: str
    project_id: str
    raw_text: str


class SowParsingResult(BaseModel):
    sow_id: str
    clauses: List[SowClauseOutput]
    clause_count: int
