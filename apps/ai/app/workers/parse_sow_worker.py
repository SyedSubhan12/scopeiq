import asyncio
import json
import structlog
from bullmq import Worker
import asyncpg

from app.config import settings
from app.schemas.sow_schemas import SowParsingInput
from app.services.sow_parser import SowParserService

logger = structlog.get_logger()


async def get_db_pool():
    return await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=5)


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
    pool = await get_db_pool()

    try:
        input_data = SowParsingInput(
            sow_id=sow_id,
            project_id=project_id or "",
            raw_text=raw_text,
        )

        result = await parser.parse(input_data)

        async with pool.acquire() as conn:
            # Remove auto-parsed placeholders first
            await conn.execute("DELETE FROM sow_clauses WHERE sow_id = $1", sow_id)

            # Insert AI-parsed clauses
            for i, clause in enumerate(result.clauses):
                await conn.execute(
                    """
                    INSERT INTO sow_clauses (sow_id, clause_type, original_text, summary, sort_order)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    sow_id,
                    clause.clause_type,
                    clause.original_text,
                    clause.summary,
                    i,
                )

            # Mark SOW as parsed
            await conn.execute(
                "UPDATE statements_of_work SET parsed_at = NOW() WHERE id = $1",
                sow_id,
            )

        logger.info("sow_clauses_written", sow_id=sow_id, clause_count=result.clause_count)
        return {"status": "ok", "clause_count": result.clause_count}

    except Exception as exc:
        logger.error("parse_sow_failed", sow_id=sow_id, error=str(exc))
        raise
    finally:
        await pool.close()


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
