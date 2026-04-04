import asyncio
import json
from datetime import datetime, timezone
import structlog
from bullmq import Worker
import asyncpg

from app.config import settings
from app.schemas.feedback_schemas import FeedbackItemInput
from app.services.feedback_summarizer import FeedbackSummarizerService

logger = structlog.get_logger()


async def get_db_pool():
    """Create a connection pool for database operations."""
    return await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=5)


async def process_summarize_feedback(job, token):
    """Process a feedback summarization job from the queue."""
    deliverable_id = job.data.get("deliverable_id")
    logger.info("processing_summarize_feedback", deliverable_id=deliverable_id)

    summarizer = FeedbackSummarizerService()

    # Fetch feedback items from database
    pool = await get_db_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, body, annotation_json, source, author_name, created_at
                FROM feedback_items
                WHERE deliverable_id = $1
                ORDER BY created_at ASC
                """,
                deliverable_id,
            )

        if not rows:
            logger.warning("no_feedback_items_found", deliverable_id=deliverable_id)
            return {"deliverable_id": deliverable_id, "task_count": 0, "overall_notes": "No feedback found."}

        items = []
        for row in rows:
            annotation = row["annotation_json"] or {}
            if isinstance(annotation, str):
                annotation = json.loads(annotation)
            items.append(
                FeedbackItemInput(
                    pin_number=annotation.get("pin_number", 0),
                    x_pos=float(annotation.get("x_pos", 0.0)),
                    y_pos=float(annotation.get("y_pos", 0.0)),
                    content=row["body"],
                    author_type=row["source"] or "portal",
                    page_number=annotation.get("page_number"),
                )
            )

        result = await summarizer.summarize(items)

        logger.info(
            "feedback_summarized",
            deliverable_id=deliverable_id,
            task_count=len(result.tasks),
        )

        # Store summary result in database — update deliverable with AI summary
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE deliverables
                SET ai_feedback_summary = $1,
                    updated_at = NOW()
                WHERE id = $2
                """,
                json.dumps({
                    "tasks": [t.dict() for t in result.tasks],
                    "overall_notes": result.overall_notes,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }),
                deliverable_id,
            )

        return {
            "deliverable_id": deliverable_id,
            "task_count": len(result.tasks),
            "overall_notes": result.overall_notes,
        }
    finally:
        await pool.close()


def start_worker():
    """Start the BullMQ worker for feedback summarization."""
    worker = Worker(
        "feedback-summarization",
        process_summarize_feedback,
        {
            "connection": settings.REDIS_URL,
            "concurrency": 5,
        },
    )
    logger.info("feedback_summarization_worker_started")
    return worker


if __name__ == "__main__":
    worker = start_worker()
    asyncio.get_event_loop().run_forever()
