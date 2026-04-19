import asyncio
import structlog
import time

from google.genai import types

from app.gemini_client import get_gemini_client
from app.config import settings
from app.schemas.sow_schemas import SowParsingInput, SowParsingResult, SowClauseOutput
from app.prompts.sow_parsing_prompt import SOW_PARSING_SYSTEM_PROMPT

logger = structlog.get_logger()

SOW_PARSING_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="parse_sow",
            description="Extract structured clauses from a Statement of Work document",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "clauses": types.Schema(
                        type="ARRAY",
                        description="All extracted clauses from the SOW",
                        items=types.Schema(
                            type="OBJECT",
                            properties={
                                "clause_type": types.Schema(
                                    type="STRING",
                                    enum=[
                                        "deliverable",
                                        "revision_limit",
                                        "timeline",
                                        "exclusion",
                                        "payment_term",
                                        "other",
                                    ],
                                ),
                                "original_text": types.Schema(type="STRING"),
                                "summary": types.Schema(type="STRING"),
                                "section_reference": types.Schema(type="STRING"),
                            },
                            required=["clause_type", "original_text", "summary"],
                        ),
                    ),
                },
                required=["clauses"],
            ),
        )
    ]
)

SOW_PARSING_CONFIG = types.GenerateContentConfig(
    system_instruction=SOW_PARSING_SYSTEM_PROMPT,
    tools=[SOW_PARSING_TOOL],
    tool_config=types.ToolConfig(
        function_calling_config=types.FunctionCallingConfig(
            mode="ANY",
            allowed_function_names=["parse_sow"],
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
                    config=SOW_PARSING_CONFIG,
                ),
            )
            return response
        except Exception as exc:
            last_exc = exc
            if attempt < max_retries - 1:
                wait = 2 ** attempt
                logger.warning(
                    "sow_parser_retry",
                    attempt=attempt + 1,
                    wait_seconds=wait,
                    error=str(exc),
                )
                await asyncio.sleep(wait)
    raise last_exc  # type: ignore[misc]


class SowParserService:
    async def parse(self, input_data: SowParsingInput) -> SowParsingResult:
        """Parse a SOW text into structured clauses using Gemini function calling."""
        prompt = f"Parse the following Statement of Work into structured clauses:\n\n{input_data.raw_text}"
        start_ms = int(time.monotonic() * 1000)

        logger.info("parsing_sow", sow_id=input_data.sow_id, text_length=len(input_data.raw_text))

        try:
            response = await _call_gemini_with_retry(prompt)
            func_call = response.candidates[0].content.parts[0].function_call
            args = dict(func_call.args)

            raw_clauses = list(args.get("clauses", []))
            clauses = [SowClauseOutput(**dict(c)) for c in raw_clauses]

            duration_ms = int(time.monotonic() * 1000) - start_ms
            result = SowParsingResult(
                sow_id=input_data.sow_id,
                clauses=clauses,
                clause_count=len(clauses),
            )
            logger.info(
                "sow_parsed",
                sow_id=input_data.sow_id,
                clause_count=len(clauses),
                model=settings.GEMINI_MODEL,
                duration_ms=duration_ms,
                success=True,
            )
            return result

        except Exception as exc:
            duration_ms = int(time.monotonic() * 1000) - start_ms
            logger.error(
                "sow_parsing_failed",
                sow_id=input_data.sow_id,
                error=str(exc),
                model=settings.GEMINI_MODEL,
                duration_ms=duration_ms,
                success=False,
            )
            raise ValueError(f"Gemini did not return structured parsing result: {exc}") from exc
