import asyncio
import structlog
import time

from google.genai import types

from app.gemini_client import get_gemini_client
from app.config import settings
from app.schemas.brief_schemas import BriefFieldInput, BriefFlag, BriefScoreResult
from app.prompts.brief_scoring_prompt import BRIEF_SCORING_SYSTEM_PROMPT

logger = structlog.get_logger()

BRIEF_SCORING_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="score_brief",
            description="Score a client brief for clarity and flag ambiguous areas",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "score": types.Schema(
                        type="INTEGER",
                        description="Overall clarity score from 0-100",
                    ),
                    "summary": types.Schema(
                        type="STRING",
                        description="One-sentence overall assessment",
                    ),
                    "flags": types.Schema(
                        type="ARRAY",
                        items=types.Schema(
                            type="OBJECT",
                            properties={
                                "field_key": types.Schema(type="STRING"),
                                "reason": types.Schema(type="STRING"),
                                "severity": types.Schema(
                                    type="STRING",
                                    enum=["low", "medium", "high"],
                                ),
                                "suggested_question": types.Schema(type="STRING"),
                            },
                            required=["field_key", "reason", "severity", "suggested_question"],
                        ),
                    ),
                },
                required=["score", "summary", "flags"],
            ),
        )
    ]
)

BRIEF_SCORING_CONFIG = types.GenerateContentConfig(
    system_instruction=BRIEF_SCORING_SYSTEM_PROMPT,
    tools=[BRIEF_SCORING_TOOL],
    tool_config=types.ToolConfig(
        function_calling_config=types.FunctionCallingConfig(
            mode="ANY",
            allowed_function_names=["score_brief"],
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
                    config=BRIEF_SCORING_CONFIG,
                ),
            )
            return response
        except Exception as exc:
            last_exc = exc
            if attempt < max_retries - 1:
                wait = 2 ** attempt  # 1s, 2s, 4s
                logger.warning(
                    "brief_scorer_retry",
                    attempt=attempt + 1,
                    wait_seconds=wait,
                    error=str(exc),
                )
                await asyncio.sleep(wait)
    raise last_exc  # type: ignore[misc]


class BriefScorerService:
    async def score(self, fields: list[BriefFieldInput]) -> BriefScoreResult:
        """Score a brief's fields for clarity using Gemini function calling."""
        prompt = self._build_prompt(fields)
        start_ms = int(time.monotonic() * 1000)

        logger.info("scoring_brief", field_count=len(fields))

        try:
            response = await _call_gemini_with_retry(prompt)
            func_call = response.candidates[0].content.parts[0].function_call
            args = dict(func_call.args)

            # Convert flags — Gemini returns them as MapComposite objects
            raw_flags = list(args.get("flags", []))
            flags = [BriefFlag(**dict(f)) for f in raw_flags]

            score: int = int(args.get("score", 50))
            summary: str = str(args.get("summary", ""))

            # Enforce minimum 3 flags when score < 70
            if score < 70 and len(flags) < 3:
                logger.info(
                    "brief_scorer_insufficient_flags",
                    score=score,
                    flag_count=len(flags),
                    required=3,
                )
                extra_prompt = (
                    prompt
                    + f"\n\nIMPORTANT: The score is {score} (below 70). "
                    "You returned fewer than 3 flags. Please re-evaluate and return at least 3 flags "
                    "identifying the most ambiguous or unclear fields in the brief."
                )
                retry_response = await _call_gemini_with_retry(extra_prompt)
                retry_func_call = retry_response.candidates[0].content.parts[0].function_call
                retry_args = dict(retry_func_call.args)
                raw_flags = list(retry_args.get("flags", []))
                flags = [BriefFlag(**dict(f)) for f in raw_flags]
                score = int(retry_args.get("score", score))
                summary = str(retry_args.get("summary", summary))

                # If still fewer than 3, pad with a generic flag pointing at the brief overall
                if len(flags) < 3:
                    while len(flags) < 3:
                        idx = len(flags) + 1
                        flags.append(
                            BriefFlag(
                                field_key=f"field_{idx}",
                                reason="Field lacks sufficient detail for the project team to proceed without assumptions.",
                                severity="medium",
                                suggested_question="Could you provide more specific details about this aspect of the project?",
                            )
                        )

            duration_ms = int(time.monotonic() * 1000) - start_ms
            result = BriefScoreResult(score=score, summary=summary, flags=flags)
            logger.info(
                "brief_scored",
                score=result.score,
                flag_count=len(result.flags),
                model=settings.GEMINI_MODEL,
                duration_ms=duration_ms,
                success=True,
            )
            return result

        except Exception as exc:
            duration_ms = int(time.monotonic() * 1000) - start_ms
            logger.error(
                "brief_scoring_failed",
                error=str(exc),
                model=settings.GEMINI_MODEL,
                duration_ms=duration_ms,
                success=False,
            )
            return BriefScoreResult(
                score=50,
                summary="Unable to fully evaluate brief — manual review recommended",
                flags=[],
            )

    def _build_prompt(self, fields: list[BriefFieldInput]) -> str:
        lines = ["Please evaluate the following client brief:\n"]
        for field in fields:
            value = field.value or "(empty)"
            lines.append(f"**{field.label}** ({field.field_key}, type: {field.field_type}):")
            lines.append(f"  {value}\n")
        return "\n".join(lines)
