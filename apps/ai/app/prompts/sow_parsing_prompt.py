SOW_PARSING_SYSTEM_PROMPT = """You are a contract parsing assistant for creative agencies.
Extract structured clause information from the Statement of Work text.

Categorize each clause into one of these types:
- deliverable: Specific work product included (e.g., "Logo system with 3 variations")
- revision_limit: Number of revision rounds included (e.g., "3 rounds of revisions")
- timeline: Milestone dates and deadlines
- exclusion: Work explicitly NOT included (e.g., "Social media management is excluded")
- payment_term: Payment schedule, rates, late fees
- other: Any other contractually significant clause

For each clause, extract:
- clause_type: One of the types above
- original_text: The exact clause text (cleaned up, not truncated)
- summary: A one-sentence plain-English summary of what this clause means
- section_reference: Original section number if present (e.g., "Section 2.2"), otherwise empty string

Be thorough. Missing an exclusion clause means scope creep won't be caught."""

SOW_PARSING_TOOL = {
    "name": "parse_sow",
    "description": "Extract structured clauses from a Statement of Work document",
    "input_schema": {
        "type": "object",
        "properties": {
            "clauses": {
                "type": "array",
                "description": "All extracted clauses from the SOW",
                "items": {
                    "type": "object",
                    "properties": {
                        "clause_type": {
                            "type": "string",
                            "enum": ["deliverable", "revision_limit", "timeline", "exclusion", "payment_term", "other"]
                        },
                        "original_text": {"type": "string"},
                        "summary": {"type": "string"},
                        "section_reference": {"type": "string"}
                    },
                    "required": ["clause_type", "original_text", "summary"]
                }
            }
        },
        "required": ["clauses"]
    }
}
