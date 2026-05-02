import asyncio
import structlog
import time
import json
from anthropic import AsyncAnthropic, APIError, RateLimitError

from app.anthropic_client import get_anthropic_client
from app.config import settings
from app.schemas.scope_schemas import ScopeAnalysisInput, ScopeAnalysisResult
from app.prompts.scope_guard_prompt import SCOPE_GUARD_SYSTEM_PROMPT

logger = structlog.get_logger()

SCOPE_ANALYSIS_TOOL = {
    "name": "analyze_scope",
    "description": "Analyze a project request against SOW clauses for deviations",
    "input_schema": {
        "type": "object",
        "properties": {
            "is_deviation": {
                "type": "boolean",
                "description": "True if the request falls outside the defined scope clauses"
            },
            "confidence": {
                "type": "number",
                "description": "Confidence score from 0.0 to 1.0"
            },
            "reasoning": {
                "type": "string",
                "description": "Detailed reasoning for the scope determination, citing specific clauses"
            },
            "matched_clause_id": {
                "type": "string",
                "description": "The ID of the most relevant SOW clause that was matched or violated"
            },
            "suggested_severity": {
                "type": "string",
                "enum": ["low", "medium", "high"],
                "description": "Severity of the deviation"
            },
            "suggested_response": {
                "type": "string",
                "description": "A professional, non-confrontational suggested response for the agency"
            }
        },
        "required": ["is_deviation", "confidence", "reasoning", "suggested_severity", "suggested_response"]
    }
}

async def _call_claude_with_retry(system_prompt: str, user_prompt: str, max_retries: int = 3) -> dict:
    client = get_anthropic_client()
    last_exc = None
    
    for attempt in range(max_retries):
        try:
            response = await client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=2048,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                tools=[SCOPE_ANALYSIS_TOOL],
                tool_choice={"type": "tool", "name": "analyze_scope"}
            )
            
            # Find the tool use part
            for content_block in response.content:
                if content_block.type == "tool_use":
                    return content_block.input
            
            raise ValueError("Claude failed to provide tool_use output")
            
        except (RateLimitError, APIError) as exc:
            last_exc = exc
            if attempt < max_retries - 1:
                wait = 2 ** attempt
                logger.warning(
                    "scope_analyzer_retry",
                    attempt=attempt + 1,
                    wait_seconds=wait,
                    error=str(exc),
                )
                await asyncio.sleep(wait)
        except Exception as exc:
            logger.error("claude_invocation_error", error=str(exc))
            raise

    raise last_exc or ValueError("Claude invocation failed")

class ScopeAnalyzerService:
    async def analyze(self, input_data: ScopeAnalysisInput) -> ScopeAnalysisResult:
        """Analyze a text request against SOW clauses using Claude tool_use."""
        user_prompt = self._build_prompt(input_data)
        start_ms = int(time.monotonic() * 1000)

        logger.info(
            "analyzing_scope",
            project_id=input_data.project_id,
            clause_count=len(input_data.clauses),
            model=settings.ANTHROPIC_MODEL
        )

        try:
            # v3.0 mandate: Claude API called with tool_use output schema
            args = await _call_claude_with_retry(
                system_prompt=SCOPE_GUARD_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )

            is_deviation: bool = bool(args.get("is_deviation", False))
            confidence: float = float(args.get("confidence", 0.0))
            reasoning: str = str(args.get("reasoning", ""))
            suggested_severity: str = str(args.get("suggested_severity", "medium"))
            suggested_response: str = str(args.get("suggested_response", ""))
            
            # matched_clause_id handle
            matched_clause_id_raw = args.get("matched_clause_id")
            matched_clause_id: str | None = (
                str(matched_clause_id_raw) if matched_clause_id_raw else None
            )

            duration_ms = int(time.monotonic() * 1000) - start_ms
            
            # Rule 3 check: Verify return object matches expected schema
            result = ScopeAnalysisResult(
                is_deviation=is_deviation,
                confidence=confidence,
                reasoning=reasoning,
                matched_clause_id=matched_clause_id,
                suggested_severity=suggested_severity,
                suggested_response=suggested_response
            )

            logger.info(
                "scope_analyzed",
                project_id=input_data.project_id,
                is_deviation=result.is_deviation,
                confidence=result.confidence,
                model=settings.ANTHROPIC_MODEL,
                duration_ms=duration_ms,
                success=True,
            )
            return result

        except Exception as exc:
            duration_ms = int(time.monotonic() * 1000) - start_ms
            logger.error(
                "scope_analysis_failed",
                project_id=input_data.project_id,
                error=str(exc),
                model=settings.ANTHROPIC_MODEL,
                duration_ms=duration_ms,
                success=False,
            )
            # Fail closed: re-raise so BullMQ retries with backoff.
            # Synthesizing a default verdict would silently mask AI outages and
            # let real out-of-scope work pass without a scope flag (Rule 8 trust
            # violation). Per FIND-003.
            raise

    def _build_prompt(self, input_data: ScopeAnalysisInput) -> str:
        lines = [
            "### CLIENT REQUEST / COMMUNICATION:",
            f"{input_data.input_text}\n",
            "### PROJECT SOW CLAUSES:",
        ]
        for clause in input_data.clauses:
            lines.append(f"- ID: {clause.id}")
            lines.append(f"  TYPE: {clause.clause_type}")
            if clause.summary:
                lines.append(f"  SUMMARY: {clause.summary}")
            lines.append(f"  TEXT: {clause.original_text}\n")
        return "\n".join(lines)
