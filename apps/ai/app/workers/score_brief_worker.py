import asyncio
import json
import structlog
from bullmq import Worker
import asyncpg

from app.config import settings
from app.schemas.brief_schemas import BriefFieldInput
from app.services.brief_scorer import BriefScorerService

logger = structlog.get_logger()


async def get_db_pool():
    """Create a connection pool for database operations."""
    return await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=5)


async def process_score_brief(job, token):
    """Process a brief scoring job from the queue."""
    brief_id = job.data.get("brief_id")
    logger.info("processing_score_brief", brief_id=brief_id)

    scorer = BriefScorerService()

    # Fetch brief fields from database
    pool = await get_db_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT field_key, field_label, field_type, value
                FROM brief_fields
                WHERE brief_id = $1
                ORDER BY sort_order ASC
                """,
                brief_id,
            )

        if not rows:
            logger.warning("no_brief_fields_found", brief_id=brief_id)
            return {"brief_id": brief_id, "score": 0, "status": "clarification_needed", "flag_count": 0}

        fields = [
            BriefFieldInput(
                field_key=row["field_key"],
                field_type=row["field_type"],
                label=row["field_label"],
                value=row["value"] or "",
            )
            for row in rows
        ]

        result = await scorer.score(fields)

        logger.info(
            "brief_scored",
            brief_id=brief_id,
            score=result.score,
            flag_count=len(result.flags),
        )

        # Update brief record in database with score + status
        # scope_score < 50 → clarification_needed, >= 50 → scored
        new_status = "clarification_needed" if result.score < 50 else "scored"
        scoring_result = json.dumps({
            "score": result.score,
            "summary": result.summary,
            "flags": [f.dict() for f in result.flags],
        })
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE briefs
                SET scope_score = $1,
                    scoring_result_json = $2::jsonb,
                    status = $3,
                    scored_at = NOW(),
                    updated_at = NOW()
                WHERE id = $4
                """,
                result.score,
                scoring_result,
                new_status,
                brief_id,
            )

        return {
            "brief_id": brief_id,
            "score": result.score,
            "summary": result.summary,
            "status": new_status,
            "flag_count": len(result.flags),
        }
    finally:
        await pool.close()


def start_worker():
    """Start the BullMQ worker for brief scoring."""
    worker = Worker(
        "brief-scoring",
        process_score_brief,
        {
            "connection": settings.REDIS_URL,
            "concurrency": 5,
        },
    )
    logger.info("brief_scoring_worker_started")
    return worker


if __name__ == "__main__":
    worker = start_worker()
    asyncio.get_event_loop().run_forever()
