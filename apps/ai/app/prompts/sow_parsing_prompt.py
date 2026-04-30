# Prompt: sow_parsing_v2
# Version: 2.0
# Date: 2026-04-25
# Model: gemini-2.0-flash
# Changelog: Added graduated confidence levels (HIGH/MEDIUM/LOW), verbatim source text,
#             page numbers, and requires_human_review flag for HITL review flow.

SOW_PARSING_SYSTEM_PROMPT = """
You are a legal document analyst specializing in creative agency contracts.
Extract structured clauses from Statements of Work with calibrated confidence scores.

CONFIDENCE CALIBRATION:
- HIGH (>0.85): Clause text is explicit, unambiguous, and clearly maps to the clause type
- MEDIUM (0.65-0.85): Clause is present but uses indirect language or has minor ambiguity
- LOW (<0.65): Clause is inferred, partially stated, or may be misclassified

EXTRACTION RULES:
1. Extract ONLY what is explicitly stated — do not infer or assume
2. For each clause, include the verbatim source text from the document
3. Note the page number where the clause appears
4. If a section seems to cover multiple clause types, split into separate clauses
5. Mark as requires_human_review=True if confidence < 0.65

CLAUSE TYPES TO EXTRACT:
- deliverable: specific work products to be delivered
- exclusion: work explicitly NOT included
- revision_limit: number of revision rounds allowed
- timeline: delivery dates or milestones
- payment_term: payment schedule and amounts
- acceptance_criteria: what constitutes completion
"""

SOW_CLAUSE_EXTRACTION_TOOL_SCHEMA = {
    "name": "extract_sow_clauses",
    "description": "Extract structured clauses from a Statement of Work document",
    "parameters": {
        "type": "object",
        "properties": {
            "clauses": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "clause_type": {
                            "type": "string",
                            "enum": ["deliverable", "exclusion", "revision_limit",
                                     "timeline", "payment_term", "acceptance_criteria"]
                        },
                        "content": {"type": "string", "description": "Normalized clause text"},
                        "confidence_score": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                        "raw_text_source": {"type": "string", "description": "Verbatim from document"},
                        "page_number": {"type": "integer"},
                        "requires_human_review": {"type": "boolean"}
                    },
                    "required": ["clause_type", "content", "confidence_score",
                                 "raw_text_source", "requires_human_review"]
                }
            },
            "document_summary": {"type": "string"},
            "overall_confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
            "extraction_warnings": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Any issues found during extraction"
            }
        },
        "required": ["clauses", "document_summary", "overall_confidence"]
    }
}


def compute_confidence_level(score: float) -> str:
    if score > 0.85:
        return "high"
    elif score >= 0.65:
        return "medium"
    return "low"
