import anthropic
import structlog
from app.config import settings
from app.schemas.sow_schemas import SowParsingInput, SowParsingResult, SowClauseOutput
from app.prompts.sow_parsing_prompt import SOW_PARSING_SYSTEM_PROMPT, SOW_PARSING_TOOL

logger = structlog.get_logger()


class SowParserService:
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def parse(self, input_data: SowParsingInput) -> SowParsingResult:
        """Parse a SOW text into structured clauses using Claude."""
        logger.info("parsing_sow", sow_id=input_data.sow_id, text_length=len(input_data.raw_text))

        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=4096,
            system=SOW_PARSING_SYSTEM_PROMPT,
            tools=[SOW_PARSING_TOOL],
            tool_choice={"type": "tool", "name": "parse_sow"},
            messages=[{
                "role": "user",
                "content": f"Parse the following Statement of Work into structured clauses:\n\n{input_data.raw_text}"
            }],
        )

        for block in response.content:
            if block.type == "tool_use" and block.name == "parse_sow":
                raw_clauses = block.input.get("clauses", [])
                clauses = [SowClauseOutput(**c) for c in raw_clauses]
                result = SowParsingResult(
                    sow_id=input_data.sow_id,
                    clauses=clauses,
                    clause_count=len(clauses),
                )
                logger.info("sow_parsed", sow_id=input_data.sow_id, clause_count=len(clauses))
                return result

        logger.error("sow_parsing_failed_no_tool_use", sow_id=input_data.sow_id)
        raise ValueError("Claude did not return structured parsing result")
