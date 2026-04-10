import asyncio
import structlog
from bullmq import Worker

from app.config import settings
from app.schemas.sow_schemas import SowParsingInput
from app.services.sow_parser import SowParserService
from app.services.callback_service import post_callback

logger = structlog.get_logger()


async def process_parse_sow(job, token):
    """
    Parse a SOW with Gemini and write structured clauses back to the DB.
    Job data: { sow_id, project_id, raw_text }
    """
    sow_id = job.data.get("sow_id")
    project_id = job.data.get("project_id")
    raw_text = job.data.get("raw_text")

    if not sow_id or not raw_text:
        logger.warning("parse_sow_missing_data", job_id=job.id)
        return {"status": "skipped", "reason": "missing sow_id or raw_text"}

    logger.info("processing_parse_sow", sow_id=sow_id, project_id=project_id)

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
