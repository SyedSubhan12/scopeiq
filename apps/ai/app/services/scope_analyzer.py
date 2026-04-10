import asyncio
import structlog
import time

from google.genai import types

from app.gemini_client import get_gemini_client
from app.config import settings
from app.schemas.scope_schemas import ScopeAnalysisInput, ScopeAnalysisResult
from app.prompts.scope_guard_prompt import SCOPE_GUARD_SYSTEM_PROMPT

logger = structlog.get_logger()

SCOPE_ANALYSIS_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="analyze_scope",
            description="Analyze a project request against SOW clauses for deviations",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "is_deviation": types.Schema(type="BOOLEAN"),
                    "confidence": types.Schema(
                        type="NUMBER",
                        description="Confidence score from 0.0 to 1.0",
                    ),
                    "reasoning": types.Schema(type="STRING"),
                    "matched_clause_id": types.Schema(type="STRING"),
                    "suggested_severity": types.Schema(
                        type="STRING",
                        enum=["low", "medium", "high"],
                    ),
                },
                required=["is_deviation", "confidence", "reasoning", "suggested_severity"],
            ),
        )
    ]
)

SCOPE_ANALYSIS_CONFIG = types.GenerateContentConfig(
    system_instruction=SCOPE_GUARD_SYSTEM_PROMPT,
    tools=[SCOPE_ANALYSIS_TOOL],
    tool_config=types.ToolConfig(
        function_calling_config=types.FunctionCallingConfig(
            mode="ANY",
            allowed_function_names=["analyze_scope"],
        )
    ),
)


async def _call_gemini_with_retry(prompt: str, max_retries: int = 3) -> types.GenerateContentResponse:
    client = get_gemini_client()
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=SCOPE_ANALYSIS_CONFIG,
                ),
            )
            return response
        except Exception as exc:
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
    raise last_exc  # type: ignore[misc]


class ScopeAnalyzerService:
    async def analyze(self, input_data: ScopeAnalysisInput) -> ScopeAnalysisResult:
        """Analyze a text request against SOW clauses using Gemini function calling."""
        prompt = self._build_prompt(input_data)
        start_ms = int(time.monotonic() * 1000)

        logger.info(
            "analyzing_scope",
            project_id=input_data.project_id,
            clause_count=len(input_data.clauses),
        )

        try:
            response = await _call_gemini_with_retry(prompt)
            func_call = response.candidates[0].content.parts[0].function_call
            args = dict(func_call.args)

            is_deviation: bool = bool(args.get("is_deviation", False))
            confidence: float = float(args.get("confidence", 0.0))
            reasoning: str = str(args.get("reasoning", ""))
            suggested_severity: str = str(args.get("suggested_severity", "medium"))
            # matched_clause_id may be absent or null — handle both
            matched_clause_id_raw = args.get("matched_clause_id")
            matched_clause_id: str | None = (
                str(matched_clause_id_raw) if matched_clause_id_raw else None
            )

            duration_ms = int(time.monotonic() * 1000) - start_ms
            result = ScopeAnalysisResult(
                is_deviation=is_deviation,
                confidence=confidence,
                reasoning=reasoning,
                matched_clause_id=matched_clause_id,
                suggested_severity=suggested_severity,
            )

            logger.info(
                "scope_analyzed",
                project_id=input_data.project_id,
                is_deviation=result.is_deviation,
                confidence=result.confidence,
                model=settings.GEMINI_MODEL,
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
                model=settings.GEMINI_MODEL,
                duration_ms=duration_ms,
                success=False,
            )
            return ScopeAnalysisResult(
                is_deviation=False,
                confidence=0.0,
                reasoning="Unable to perform semantic analysis — internal error",
                suggested_severity="low",
            )

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
