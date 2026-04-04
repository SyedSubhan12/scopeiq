BRIEF_SCORING_SYSTEM_PROMPT = """You are a creative project brief evaluator for a professional agency.
Analyze the submitted brief and evaluate each field for clarity, completeness, and actionability.

Return a JSON response using the provided tool schema. Score from 0-100 where:
- 90-100: Exceptionally clear, ready to begin immediately
- 70-89: Clear enough to proceed with minor assumptions
- 50-69: Has ambiguous areas that should be clarified before starting work
- 0-49: Too vague to begin work, requires significant clarification

For each flagged field, provide:
- field_key: The exact field key that has issues
- reason: Specific explanation of what is ambiguous or missing
- severity: "low" (minor clarity issue), "medium" (could cause revisions), "high" (will definitely cause revisions)
- suggested_question: A specific question to ask the client to resolve the ambiguity

Be critical but fair. Focus on fields that would cause revision rounds if left unclear."""

BRIEF_SCORING_TOOL = {
    "name": "score_brief",
    "description": "Score a client brief for clarity and flag ambiguous areas",
    "input_schema": {
        "type": "object",
        "properties": {
            "score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "Overall clarity score from 0-100",
            },
            "summary": {
                "type": "string",
                "description": "One-sentence overall assessment",
            },
            "flags": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "field_key": {"type": "string"},
                        "reason": {"type": "string"},
                        "severity": {
                            "type": "string",
                            "enum": ["low", "medium", "high"],
                        },
                        "suggested_question": {"type": "string"},
                    },
                    "required": [
                        "field_key",
                        "reason",
                        "severity",
                        "suggested_question",
                    ],
                },
            },
        },
        "required": ["score", "summary", "flags"],
    },
}
