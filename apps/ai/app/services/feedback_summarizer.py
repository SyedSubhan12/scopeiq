import asyncio
import structlog
import time

from google.genai import types

from app.gemini_client import get_gemini_client
from app.config import settings
from app.schemas.feedback_schemas import FeedbackItemInput, FeedbackSummaryResult, RevisionTask
from app.prompts.feedback_summary_prompt import FEEDBACK_SUMMARY_SYSTEM_PROMPT

logger = structlog.get_logger()

FEEDBACK_SUMMARY_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="summarize_feedback",
            description="Convert raw client feedback into a prioritized task list",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "tasks": types.Schema(
                        type="ARRAY",
                        items=types.Schema(
                            type="OBJECT",
                            properties={
                                "action": types.Schema(type="STRING"),
                                "impact": types.Schema(
                                    type="STRING",
                                    enum=["high", "medium", "low"],
                                ),
                                "source_pin": types.Schema(type="INTEGER"),
                                "contradiction": types.Schema(type="BOOLEAN"),
                                "conflict_explanation": types.Schema(type="STRING"),
                            },
                            required=["action", "impact", "source_pin", "contradiction"],
                        ),
                    ),
                    "overall_notes": types.Schema(
                        type="STRING",
                        description="General notes about the feedback as a whole",
                    ),
                },
                required=["tasks", "overall_notes"],
            ),
        )
    ]
)

FEEDBACK_SUMMARY_CONFIG = types.GenerateContentConfig(
    system_instruction=FEEDBACK_SUMMARY_SYSTEM_PROMPT,
    tools=[FEEDBACK_SUMMARY_TOOL],
    tool_config=types.ToolConfig(
        function_calling_config=types.FunctionCallingConfig(
            mode="ANY",
            allowed_function_names=["summarize_feedback"],
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
                    config=FEEDBACK_SUMMARY_CONFIG,
                ),
            )
            return response
        except Exception as exc:
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
    raise last_exc  # type: ignore[misc]


class FeedbackSummarizerService:
    async def summarize(self, items: list[FeedbackItemInput]) -> FeedbackSummaryResult:
        """Summarize feedback items into a prioritized task list using Gemini function calling."""
        prompt = self._build_prompt(items)
        start_ms = int(time.monotonic() * 1000)

        logger.info("summarizing_feedback", item_count=len(items))

        try:
            response = await _call_gemini_with_retry(prompt)
            func_call = response.candidates[0].content.parts[0].function_call
            args = dict(func_call.args)

            raw_tasks = list(args.get("tasks", []))
            tasks = [RevisionTask(**dict(t)) for t in raw_tasks]
            overall_notes = str(args.get("overall_notes", ""))

            duration_ms = int(time.monotonic() * 1000) - start_ms
            result = FeedbackSummaryResult(tasks=tasks, overall_notes=overall_notes)
            logger.info(
                "feedback_summarized",
                task_count=len(result.tasks),
                model=settings.GEMINI_MODEL,
                duration_ms=duration_ms,
                success=True,
            )
            return result

        except Exception as exc:
            duration_ms = int(time.monotonic() * 1000) - start_ms
            logger.error(
                "feedback_summarization_failed",
                error=str(exc),
                model=settings.GEMINI_MODEL,
                duration_ms=duration_ms,
                success=False,
            )
            return FeedbackSummaryResult(
                tasks=[],
                overall_notes="Unable to summarize feedback — manual review recommended",
            )

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
