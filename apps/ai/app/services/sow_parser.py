import asyncio
import structlog
import time

from google.genai import types

from app.gemini_client import get_gemini_client
from app.config import settings
from app.schemas.sow_schemas import SowParsingInput, SowParsingResult, SowClauseOutput
from app.prompts.sow_parsing_prompt import (
    SOW_PARSING_SYSTEM_PROMPT,
    compute_confidence_level,
)

logger = structlog.get_logger()

# Build the Gemini tool declaration from the prompt module's schema.
# We translate the JSON Schema into google.genai types to keep the schema
# definition as a single source of truth in sow_parsing_prompt.py.
SOW_PARSING_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="extract_sow_clauses",
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
                                        "exclusion",
                                        "revision_limit",
                                        "timeline",
                                        "payment_term",
                                        "acceptance_criteria",
                                    ],
                                ),
                                "content": types.Schema(
                                    type="STRING",
                                    description="Normalized clause text",
                                ),
                                "confidence_score": types.Schema(
                                    type="NUMBER",
                                    description="Extraction confidence 0.0–1.0",
                                ),
                                "raw_text_source": types.Schema(
                                    type="STRING",
                                    description="Verbatim text from the document",
                                ),
                                "page_number": types.Schema(
                                    type="INTEGER",
                                    description="Page number where clause appears",
                                ),
                                "requires_human_review": types.Schema(
                                    type="BOOLEAN",
                                    description="True when confidence < 0.65",
                                ),
                            },
                            required=[
                                "clause_type",
                                "content",
                                "confidence_score",
                                "raw_text_source",
                                "requires_human_review",
                            ],
                        ),
                    ),
                    "document_summary": types.Schema(type="STRING"),
                    "overall_confidence": types.Schema(
                        type="NUMBER",
                        description="Aggregate confidence across all extracted clauses",
                    ),
                    "extraction_warnings": types.Schema(
                        type="ARRAY",
                        items=types.Schema(type="STRING"),
                        description="Any issues found during extraction",
                    ),
                },
                required=["clauses", "document_summary", "overall_confidence"],
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
            allowed_function_names=["extract_sow_clauses"],
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


def _build_clause(raw: dict) -> SowClauseOutput:
    """Convert a raw Gemini function-call argument dict into a SowClauseOutput.

    Populates confidence_level from confidence_score and enforces the
    requires_human_review flag for low-confidence clauses.
    """
    score: float | None = raw.get("confidence_score")
    level = compute_confidence_level(score) if score is not None else None
    # Ensure requires_human_review is True for low-confidence clauses regardless
    # of what the model returned.
    review_flag: bool = raw.get("requires_human_review", False)
    if score is not None and score < 0.65:
        review_flag = True

    return SowClauseOutput(
        clause_type=raw["clause_type"],
        content=raw.get("content"),
        original_text=raw.get("content") or raw.get("original_text"),
        raw_text_source=raw.get("raw_text_source"),
        page_number=raw.get("page_number"),
        confidence_score=score,
        confidence_level=level,
        requires_human_review=review_flag,
    )


class SowParserService:
    async def parse(self, input_data: SowParsingInput) -> SowParsingResult:
        """Parse a SOW text into structured clauses using Gemini function calling."""
        prompt = (
            "Parse the following Statement of Work into structured clauses "
            "with calibrated confidence scores:\n\n"
            f"{input_data.raw_text}"
        )
        start_ms = int(time.monotonic() * 1000)

        logger.info("parsing_sow", sow_id=input_data.sow_id, text_length=len(input_data.raw_text))

        try:
            response = await _call_gemini_with_retry(prompt)
            func_call = response.candidates[0].content.parts[0].function_call
            args = dict(func_call.args)

            raw_clauses: list[dict] = [dict(c) for c in args.get("clauses", [])]
            clauses = [_build_clause(c) for c in raw_clauses]
            overall_confidence: float | None = args.get("overall_confidence")
            document_summary: str | None = args.get("document_summary")
            extraction_warnings: list[str] = list(args.get("extraction_warnings") or [])

            duration_ms = int(time.monotonic() * 1000) - start_ms
            result = SowParsingResult(
                sow_id=input_data.sow_id,
                clauses=clauses,
                clause_count=len(clauses),
                document_summary=document_summary,
                overall_confidence=overall_confidence,
                extraction_warnings=extraction_warnings,
            )

            low_count = sum(1 for c in clauses if c.requires_human_review)
            logger.info(
                "sow_parsed",
                sow_id=input_data.sow_id,
                clause_count=len(clauses),
                low_confidence_count=low_count,
                overall_confidence=overall_confidence,
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
