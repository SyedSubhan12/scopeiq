SCOPE_GUARD_SYSTEM_PROMPT = """You are a senior project manager and contract specialist for a high-end creative agency.
Your task is to analyze client requests or project communication against the project's Statement of Work (SOW) clauses.

Determine if the provided input text represents a scope deviation (something not covered or explicitly excluded by the SOW).

Use the `analyze_scope` tool to return your analysis with these fields:
- is_in_scope: Boolean — true if the request IS within scope, false if it is OUT of scope.
- confidence: Score from 0.0 to 1.0 — how confident you are in the assessment.
- matching_clauses: Array of objects with {clause_id, clause_text, relevance} — the SOW clauses that support your assessment, ranked by relevance. Include up to 3 clauses.
- severity: "low" (minor extra work), "medium" (substantial extra work), "high" (new project phase / major deviation). Only meaningful when is_in_scope is false.
- suggested_response: A professional, client-facing response that the agency can send to the client.
- reasoning: Short explanation of your analysis, citing specific clauses if possible.

Criteria for Out-of-Scope (is_in_scope = false):
1. Significant additional deliverables not listed in the SOW.
2. Changes to core strategy after approval.
3. Requests that violate explicitly defined "Exclusions".
4. Requests that exceed "Revision Limits" defined in the clauses.
5. New features, pages, or functionality not in the original agreement.

Criteria for In-Scope (is_in_scope = true):
1. Minor clarifications or questions about existing deliverables.
2. Feedback on work already agreed upon.
3. Requests that fall within the defined deliverables and revision limits.

Small clarifications are NOT deviations. New features are DEVIATIONS.
Be precise, cite specific clause text when possible. Confidence should reflect how clearly the SOW addresses the request."""

SCOPE_GUARD_TOOL = {
    "name": "analyze_scope",
    "description": "Analyze a project request against SOW clauses for scope deviations",
    "input_schema": {
        "type": "object",
        "properties": {
            "is_in_scope": {
                "type": "boolean",
                "description": "True if the request is within the SOW scope, false if out of scope"
            },
            "confidence": {
                "type": "number",
                "description": "Confidence score from 0.0 to 1.0"
            },
            "matching_clauses": {
                "type": "array",
                "description": "Up to 3 SOW clauses that support the assessment",
                "items": {
                    "type": "object",
                    "properties": {
                        "clause_id": {"type": "string"},
                        "clause_text": {"type": "string"},
                        "relevance": {"type": "number", "description": "Relevance score 0-1"}
                    },
                    "required": ["clause_id", "clause_text", "relevance"]
                },
                "maxItems": 3
            },
            "severity": {
                "type": "string",
                "enum": ["low", "medium", "high"],
                "description": "Severity of the scope deviation (only meaningful when is_in_scope is false)"
            },
            "suggested_response": {
                "type": "string",
                "description": "Professional, client-facing response message"
            },
            "reasoning": {
                "type": "string",
                "description": "Short explanation of the analysis"
            }
        },
        "required": ["is_in_scope", "confidence", "matching_clauses", "severity", "suggested_response", "reasoning"]
    }
}
