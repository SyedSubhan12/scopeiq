from pydantic import BaseModel
from typing import Optional, List


class SowClauseOutput(BaseModel):
    clause_type: str
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
