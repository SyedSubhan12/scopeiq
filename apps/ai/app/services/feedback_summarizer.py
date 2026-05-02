"""
Feedback summarizer — Anthropic tool_use migration (FIND-Sanity).
"""
import asyncio
import structlog
import time

from anthropic import APIError, RateLimitError

from app.anthropic_client import get_anthropic_client
from app.config import settings
from app.schemas.feedback_schemas import FeedbackItemInput, FeedbackSummaryResult, RevisionTask
from app.prompts.feedback_summary_prompt import FEEDBACK_SUMMARY_SYSTEM_PROMPT

logger = structlog.get_logger()

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
                        "impact": {"type": "string", "enum": ["high", "medium", "low"]},
                        "source_pin": {"type": "integer"},
                        "contradiction": {"type": "boolean"},
                        "conflict_explanation": {"type": "string"},
                    },
                    "required": ["action", "impact", "source_pin", "contradiction"],
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


async def _call_claude_with_retry(prompt: str, max_retries: int = 3) -> dict:
    client = get_anthropic_client()
    last_exc: Exception | None = None

    for attempt in range(max_retries):
        try:
            response = await client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=2048,
                system=FEEDBACK_SUMMARY_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
                tools=[FEEDBACK_SUMMARY_TOOL],
                tool_choice={"type": "tool", "name": "summarize_feedback"},
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
                    "feedback_summarizer_retry",
                    attempt=attempt + 1,
                    wait_seconds=wait,
                    error=str(exc),
                )
                await asyncio.sleep(wait)

    raise last_exc or ValueError("Claude feedback summarization failed")


class FeedbackSummarizerService:
    async def summarize(self, items: list[FeedbackItemInput]) -> FeedbackSummaryResult:
        """Summarize feedback items into a prioritized task list using Claude tool_use."""
        prompt = self._build_prompt(items)
        start_ms = int(time.monotonic() * 1000)

        logger.info("summarizing_feedback", item_count=len(items), model=settings.ANTHROPIC_MODEL)

        try:
            args = await _call_claude_with_retry(prompt)

            raw_tasks = list(args.get("tasks", []))
            tasks = [RevisionTask(**t) for t in raw_tasks]
            overall_notes = str(args.get("overall_notes", ""))

            duration_ms = int(time.monotonic() * 1000) - start_ms
            result = FeedbackSummaryResult(tasks=tasks, overall_notes=overall_notes)
            logger.info(
                "feedback_summarized",
                task_count=len(result.tasks),
                model=settings.ANTHROPIC_MODEL,
                duration_ms=duration_ms,
                success=True,
            )
            return result

        except Exception as exc:
            duration_ms = int(time.monotonic() * 1000) - start_ms
            logger.error(
                "feedback_summarization_failed",
                error=str(exc),
                model=settings.ANTHROPIC_MODEL,
                duration_ms=duration_ms,
                success=False,
            )
            # Re-raise so BullMQ retries (FIND-003 pattern).
            raise

    def _build_prompt(self, items: list[FeedbackItemInput]) -> str:
        lines = [
            "Please analyze the following client feedback and create a prioritized revision task list:\n"
        ]
        for item in items:
            pos = f"(pin #{item.pin_number} at {item.x_pos:.1f}%, {item.y_pos:.1f}%"
            if item.page_number:
                pos += f", page {item.page_number}"
            pos += f", from {item.author_type})"
            lines.append(f"- {pos}: {item.content}")
        return "\n".join(lines)
