import json
import anthropic
import structlog

from app.config import settings
from app.schemas.feedback_schemas import FeedbackItemInput, FeedbackSummaryResult
from app.prompts.feedback_summary_prompt import (
    FEEDBACK_SUMMARY_SYSTEM_PROMPT,
    FEEDBACK_SUMMARY_TOOL,
)

logger = structlog.get_logger()


class FeedbackSummarizerService:
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def summarize(
        self, items: list[FeedbackItemInput]
    ) -> FeedbackSummaryResult:
        """Summarize feedback items into a prioritized task list using Claude."""
        user_message = self._build_user_message(items)

        logger.info("summarizing_feedback", item_count=len(items))

        response = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=FEEDBACK_SUMMARY_SYSTEM_PROMPT,
            tools=[FEEDBACK_SUMMARY_TOOL],
            tool_choice={"type": "tool", "name": "summarize_feedback"},
            messages=[{"role": "user", "content": user_message}],
        )

        for block in response.content:
            if block.type == "tool_use" and block.name == "summarize_feedback":
                result = FeedbackSummaryResult(**block.input)
                logger.info(
                    "feedback_summarized",
                    task_count=len(result.tasks),
                )
                return result

        logger.error("no_tool_use_in_response")
        return FeedbackSummaryResult(
            tasks=[],
            overall_notes="Unable to summarize feedback — manual review recommended",
        )

    def _build_user_message(self, items: list[FeedbackItemInput]) -> str:
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
