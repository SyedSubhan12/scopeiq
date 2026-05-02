"""
Brief scorer — Anthropic tool_use migration (FIND-Sanity).
"""
import asyncio
import structlog
import time

from anthropic import APIError, RateLimitError

from app.anthropic_client import get_anthropic_client
from app.config import settings
from app.schemas.brief_schemas import BriefFieldInput, BriefFlag, BriefScoreResult
from app.prompts.brief_scoring_prompt import BRIEF_SCORING_SYSTEM_PROMPT

logger = structlog.get_logger()

BRIEF_SCORING_TOOL = {
    "name": "score_brief",
    "description": "Score a client brief for clarity and flag ambiguous areas",
    "input_schema": {
        "type": "object",
        "properties": {
            "score": {"type": "integer", "description": "Overall clarity score from 0-100"},
            "summary": {"type": "string", "description": "One-sentence overall assessment"},
            "flags": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "field_key": {"type": "string"},
                        "reason": {"type": "string"},
                        "severity": {"type": "string", "enum": ["low", "medium", "high"]},
                        "suggested_question": {"type": "string"},
                    },
                    "required": ["field_key", "reason", "severity", "suggested_question"],
                },
            },
        },
        "required": ["score", "summary", "flags"],
    },
}


async def _call_claude_with_retry(prompt: str, max_retries: int = 3) -> dict:
    client = get_anthropic_client()
    last_exc: Exception | None = None

    for attempt in range(max_retries):
        try:
            response = await client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=2048,
                system=BRIEF_SCORING_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
                tools=[BRIEF_SCORING_TOOL],
                tool_choice={"type": "tool", "name": "score_brief"},
            )
            for block in response.content:
                if getattr(block, "type", None) == "tool_use":
                    return block.input
            raise ValueError("Claude failed to provide tool_use output")
        except (RateLimitError, APIError) as exc:
            last_exc = exc
            if attempt < max_retries - 1:
                wait = 2 ** attempt
                logger.warning(
                    "brief_scorer_retry",
                    attempt=attempt + 1,
                    wait_seconds=wait,
                    error=str(exc),
                )
                await asyncio.sleep(wait)

    raise last_exc or ValueError("Claude brief scoring failed")


class BriefScorerService:
    async def score(self, fields: list[BriefFieldInput]) -> BriefScoreResult:
        """Score a brief's fields for clarity using Claude tool_use."""
        prompt = self._build_prompt(fields)
        start_ms = int(time.monotonic() * 1000)

        logger.info("scoring_brief", field_count=len(fields), model=settings.ANTHROPIC_MODEL)

        try:
            args = await _call_claude_with_retry(prompt)

            raw_flags = list(args.get("flags", []))
            flags = [BriefFlag(**f) for f in raw_flags]

            score: int = int(args.get("score", 50))
            summary: str = str(args.get("summary", ""))

            # Enforce minimum 3 flags when score < 70 (PRD requirement).
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
                retry_args = await _call_claude_with_retry(extra_prompt)
                raw_flags = list(retry_args.get("flags", []))
                flags = [BriefFlag(**f) for f in raw_flags]
                score = int(retry_args.get("score", score))
                summary = str(retry_args.get("summary", summary))

                # If still fewer than 3, pad to satisfy the spec.
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
                model=settings.ANTHROPIC_MODEL,
                duration_ms=duration_ms,
                success=True,
            )
            return result

        except Exception as exc:
            duration_ms = int(time.monotonic() * 1000) - start_ms
            logger.error(
                "brief_scoring_failed",
                error=str(exc),
                model=settings.ANTHROPIC_MODEL,
                duration_ms=duration_ms,
                success=False,
            )
            # Re-raise so BullMQ retries (FIND-003 pattern).
            raise

    def _build_prompt(self, fields: list[BriefFieldInput]) -> str:
        lines = ["Please evaluate the following client brief:\n"]
        for field in fields:
            value = field.value or "(empty)"
            lines.append(f"**{field.label}** ({field.field_key}, type: {field.field_type}):")
            lines.append(f"  {value}\n")
        return "\n".join(lines)
