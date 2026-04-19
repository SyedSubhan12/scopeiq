import asyncio
import io
import structlog
from bullmq import Worker

import fitz  # PyMuPDF
import aiohttp
import aioboto3

from app.config import settings
from app.schemas.sow_schemas import SowParsingInput
from app.services.sow_parser import SowParserService
from app.services.callback_service import post_callback

logger = structlog.get_logger()

# Minimum extracted text length to proceed with parsing.
# PDFs that yield less (e.g. pure image scans) are skipped with a warning.
_MIN_TEXT_LENGTH = 50


def _extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using PyMuPDF."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    parts: list[str] = []
    for page in doc:
        parts.append(page.get_text())
    doc.close()
    return "\n".join(parts).strip()


async def _fetch_pdf_via_signed_url(storage_url: str) -> bytes:
    """Download PDF bytes from a presigned URL."""
    async with aiohttp.ClientSession() as session:
        async with session.get(storage_url, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            resp.raise_for_status()
            return await resp.read()


async def _fetch_pdf_via_s3(object_key: str) -> bytes:
    """Download PDF bytes directly from the storage bucket using S3 credentials."""
    scheme = "https" if settings.STORAGE_USE_SSL else "http"
    endpoint_url = f"{scheme}://{settings.STORAGE_ENDPOINT}:{settings.STORAGE_PORT}"

    session = aioboto3.Session(
        aws_access_key_id=settings.STORAGE_ACCESS_KEY,
        aws_secret_access_key=settings.STORAGE_SECRET_KEY,
    )
    async with session.client(
        "s3",
        endpoint_url=endpoint_url,
        region_name="us-east-1",
    ) as s3:
        response = await s3.get_object(Bucket=settings.STORAGE_BUCKET, Key=object_key)
        body = response["Body"]
        return await body.read()


async def _resolve_raw_text(job_data: dict) -> str:
    """
    Return the text that should be sent to Claude.

    Priority:
      1. raw_text already present in job_data — use directly.
      2. storage_url provided — fetch PDF via signed URL and extract with PyMuPDF.
      3. object_key provided — fetch PDF directly from storage bucket and extract.
    """
    raw_text: str = job_data.get("raw_text") or ""
    if raw_text.strip():
        return raw_text

    storage_url: str | None = job_data.get("storage_url")
    object_key: str | None = job_data.get("object_key")

    if not storage_url and not object_key:
        return ""

    logger.info("sow_pdf_extraction_start", object_key=object_key, has_url=bool(storage_url))

    try:
        if storage_url:
            pdf_bytes = await _fetch_pdf_via_signed_url(storage_url)
        else:
            # storage_url was not provided or expired; fall back to direct S3 access
            pdf_bytes = await _fetch_pdf_via_s3(object_key)  # type: ignore[arg-type]

        extracted = _extract_text_from_pdf_bytes(pdf_bytes)
        logger.info("sow_pdf_extraction_complete", object_key=object_key, text_length=len(extracted))
        return extracted

    except Exception as exc:
        logger.error("sow_pdf_extraction_failed", object_key=object_key, error=str(exc))
        raise


async def process_parse_sow(job, token):
    """
    Parse a SOW with Gemini and POST results to the API callback.

    Job data:
      - sow_id      (required)
      - project_id
      - raw_text    — plain text; when empty the worker extracts it from the PDF
      - object_key  — storage object key for the uploaded PDF
      - storage_url — short-lived signed download URL for the PDF
    """
    sow_id = job.data.get("sow_id")
    project_id = job.data.get("project_id")

    if not sow_id:
        logger.warning("parse_sow_missing_sow_id", job_id=job.id)
        return {"status": "skipped", "reason": "missing sow_id"}

    # Resolve text — either from job_data directly or by extracting from the PDF
    raw_text = await _resolve_raw_text(job.data)

    if not raw_text or len(raw_text.strip()) < _MIN_TEXT_LENGTH:
        logger.warning(
            "parse_sow_insufficient_text",
            job_id=job.id,
            sow_id=sow_id,
            text_length=len(raw_text) if raw_text else 0,
        )
        return {"status": "skipped", "reason": "insufficient_text"}

    logger.info("processing_parse_sow", sow_id=sow_id, project_id=project_id, text_length=len(raw_text))

    parser = SowParserService()

    try:
        input_data = SowParsingInput(
            sow_id=sow_id,
            project_id=project_id or "",
            raw_text=raw_text,
        )

        result = await parser.parse(input_data)

        # POST results to the API callback instead of writing directly to DB
        callback_payload = {
            "jobId": job.id,
            "sowId": sow_id,
            "projectId": project_id,
            "clauses": [
                {
                    "clauseType": clause.clause_type,
                    "originalText": clause.original_text,
                    "summary": clause.summary,
                    "sortOrder": i,
                }
                for i, clause in enumerate(result.clauses)
            ],
            "clauseCount": result.clause_count,
        }

        response = await post_callback("/api/ai-callback/sow-parsed", callback_payload)

        logger.info("sow_clauses_submitted", sow_id=sow_id, clause_count=result.clause_count)
        return {"status": "ok", "clause_count": result.clause_count, "callback_response": response}

    except Exception as exc:
        logger.error("parse_sow_failed", sow_id=sow_id, error=str(exc))
        raise


def start_worker():
    worker = Worker(
        "parse-sow",
        process_parse_sow,
        {"connection": settings.REDIS_URL, "concurrency": 2},
    )
    logger.info("parse_sow_worker_started")
    return worker


if __name__ == "__main__":
    asyncio.run(start_worker())
