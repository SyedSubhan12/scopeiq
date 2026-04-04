import json
import anthropic
import structlog

from app.config import settings
from app.schemas.brief_schemas import BriefFieldInput, BriefScoreResult
from app.prompts.brief_scoring_prompt import (
    BRIEF_SCORING_SYSTEM_PROMPT,
    BRIEF_SCORING_TOOL,
)

logger = structlog.get_logger()


class BriefScorerService:
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def score(self, fields: list[BriefFieldInput]) -> BriefScoreResult:
        """Score a brief's fields for clarity using Claude with tool use."""
        user_message = self._build_user_message(fields)

        logger.info("scoring_brief", field_count=len(fields))

        response = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=BRIEF_SCORING_SYSTEM_PROMPT,
            tools=[BRIEF_SCORING_TOOL],
            tool_choice={"type": "tool", "name": "score_brief"},
            messages=[{"role": "user", "content": user_message}],
        )

        # Extract the tool use result
        for block in response.content:
            if block.type == "tool_use" and block.name == "score_brief":
                result = BriefScoreResult(**block.input)
                logger.info(
                    "brief_scored",
                    score=result.score,
                    flag_count=len(result.flags),
                )
                return result

        # Fallback if no tool use in response
        logger.error("no_tool_use_in_response")
        return BriefScoreResult(
            score=50,
            summary="Unable to fully evaluate brief — manual review recommended",
            flags=[],
        )

    def _build_user_message(self, fields: list[BriefFieldInput]) -> str:
        lines = ["Please evaluate the following client brief:\n"]
        for field in fields:
            value = field.value or "(empty)"
            lines.append(f"**{field.label}** ({field.field_key}, type: {field.field_type}):")
            lines.append(f"  {value}\n")
        return "\n".join(lines)
