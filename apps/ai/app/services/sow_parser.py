"""
SOW parser — Anthropic tool_use migration (FIND-Sanity).
Replaces the previous Gemini implementation; Round-2 audit only converted
scope_analyzer.py and left this on Gemini, which would crash at runtime now
that GEMINI_MODEL is no longer in config.py.
"""
import asyncio
import structlog
import time

from anthropic import APIError, RateLimitError

from app.anthropic_client import get_anthropic_client
from app.config import settings
from app.schemas.sow_schemas import SowParsingInput, SowParsingResult, SowClauseOutput
from app.prompts.sow_parsing_prompt import (
    SOW_PARSING_SYSTEM_PROMPT,
    compute_confidence_level,
)

logger = structlog.get_logger()

SOW_PARSING_TOOL = {
    "name": "extract_sow_clauses",
    "description": "Extract structured clauses from a Statement of Work document",
    "input_schema": {
        "type": "object",
        "properties": {
            "clauses": {
                "type": "array",
                "description": "All extracted clauses from the SOW",
                "items": {
                    "type": "object",
                    "properties": {
                        "clause_type": {
                            "type": "string",
                            "enum": [
                                "deliverable",
                                "exclusion",
                                "revision_limit",
                                "timeline",
                                "payment_term",
                                "acceptance_criteria",
                            ],
                        },
                        "content": {"type": "string", "description": "Normalized clause text"},
                        "confidence_score": {
                            "type": "number",
                            "description": "Extraction confidence 0.0–1.0",
                        },
                        "raw_text_source": {
                            "type": "string",
                            "description": "Verbatim text from the document",
                        },
                        "page_number": {
                            "type": "integer",
                            "description": "Page number where clause appears",
                        },
                        "requires_human_review": {
                            "type": "boolean",
                            "description": "True when confidence < 0.65",
                        },
                    },
                    "required": [
                        "clause_type",
                        "content",
                        "confidence_score",
                        "raw_text_source",
                        "requires_human_review",
                    ],
                },
            },
            "document_summary": {"type": "string"},
            "overall_confidence": {
                "type": "number",
                "description": "Aggregate confidence across all extracted clauses",
            },
            "extraction_warnings": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Any issues found during extraction",
            },
        },
        "required": ["clauses", "document_summary", "overall_confidence"],
    },
}


async def _call_claude_with_retry(prompt: str, max_retries: int = 3) -> dict:
    client = get_anthropic_client()
    last_exc: Exception | None = None

    for attempt in range(max_retries):
        try:
            response = await client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=4096,
                system=SOW_PARSING_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
                tools=[SOW_PARSING_TOOL],
                tool_choice={"type": "tool", "name": "extract_sow_clauses"},
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
                    "sow_parser_retry",
                    attempt=attempt + 1,
                    wait_seconds=wait,
                    error=str(exc),
                )
                await asyncio.sleep(wait)

    raise last_exc or ValueError("Claude SOW parse failed")


def _build_clause(raw: dict) -> SowClauseOutput:
    """Convert a tool_use argument dict into a SowClauseOutput.

    Populates confidence_level from confidence_score and enforces the
    requires_human_review flag for low-confidence clauses.
    """
    score: float | None = raw.get("confidence_score")
    level = compute_confidence_level(score) if score is not None else None
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
        """Parse a SOW text into structured clauses using Claude tool_use."""
        prompt = (
            "Parse the following Statement of Work into structured clauses "
            "with calibrated confidence scores:\n\n"
            f"{input_data.raw_text}"
        )
        start_ms = int(time.monotonic() * 1000)

        logger.info(
            "parsing_sow",
            sow_id=input_data.sow_id,
            text_length=len(input_data.raw_text),
            model=settings.ANTHROPIC_MODEL,
        )

        try:
            args = await _call_claude_with_retry(prompt)

            raw_clauses: list[dict] = list(args.get("clauses", []))
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
                model=settings.ANTHROPIC_MODEL,
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
                model=settings.ANTHROPIC_MODEL,
                duration_ms=duration_ms,
                success=False,
            )
            # Re-raise so the BullMQ worker retries with backoff (FIND-003 pattern).
            raise
