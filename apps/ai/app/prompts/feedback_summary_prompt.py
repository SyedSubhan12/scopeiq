FEEDBACK_SUMMARY_SYSTEM_PROMPT = """You are a creative project manager. Analyze the raw client feedback
and convert it into a structured, prioritized revision task list.

For each task:
1. Extract the specific action needed
2. Estimate impact (high/medium/low)
3. Flag any contradictions between feedback items
4. Order tasks by estimated impact (highest first)

Return a JSON response using the provided tool schema. If feedback items contradict each other,
flag both with "contradiction": true and explain the conflict."""

FEEDBACK_SUMMARY_TOOL = {
    "name": "summarize_feedback",
    "description": "Convert raw client feedback into a prioritized task list",
    "input_schema": {
        "type": "object",
        "properties": {
            "tasks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "action": {"type": "string"},
                        "impact": {
                            "type": "string",
                            "enum": ["high", "medium", "low"],
                        },
                        "source_pin": {"type": "integer"},
                        "contradiction": {"type": "boolean"},
                        "conflict_explanation": {"type": "string"},
                    },
                    "required": [
                        "action",
                        "impact",
                        "source_pin",
                        "contradiction",
                    ],
                },
            },
            "overall_notes": {
                "type": "string",
                "description": "General notes about the feedback as a whole",
            },
        },
        "required": ["tasks", "overall_notes"],
    },
}
