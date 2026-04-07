import asyncio
import json
import structlog
from bullmq import Worker

from app.config import settings
from app.schemas.brief_schemas import BriefFieldInput
from app.services.brief_scorer import BriefScorerService
from app.services.callback_service import post_callback

logger = structlog.get_logger()


async def process_score_brief(job, token):
    """Process a brief scoring job from the queue."""
    brief_id = job.data.get("brief_id")
    logger.info("processing_score_brief", brief_id=brief_id)

    scorer = BriefScorerService()

    # Brief fields should be pre-fetched and included in the job data
    # by the API dispatcher to avoid direct DB access.
    fields_data = job.data.get("fields", [])

    try:
        if not fields_data:
            # No fields available — return empty result via callback
            callback_payload = {
                "jobId": job.id,
                "briefId": brief_id,
                "score": 0,
                "summary": "No brief fields were available for scoring.",
                "flags": [],
                "status": "clarification_needed",
                "flagCount": 0,
            }
            response = await post_callback("/api/ai-callback/brief-scored", callback_payload)
            return {
                "brief_id": brief_id,
                "score": 0,
                "summary": "No brief fields were available for scoring.",
                "status": "clarification_needed",
                "flag_count": 0,
                "callback_response": response,
            }

        fields = [
            BriefFieldInput(
                field_key=row["field_key"],
                field_type=row["field_type"],
                label=row["field_label"],
                value=row["value"] or "",
            )
            for row in fields_data
        ]

        result = await scorer.score(fields)

        logger.info(
            "brief_scored",
            brief_id=brief_id,
            score=result.score,
            flag_count=len(result.flags),
        )

        # Determine status based on score
        new_status = "clarification_needed" if result.score < 50 else "scored"

        # POST results to the API callback instead of writing directly to DB
        callback_payload = {
            "jobId": job.id,
            "briefId": brief_id,
            "score": result.score,
            "summary": result.summary,
            "flags": [
                {
                    "fieldKey": f.field_key,
                    "reason": f.reason,
                    "severity": f.severity,
                    "suggestedQuestion": f.suggested_question,
                }
                for f in result.flags
            ],
            "status": new_status,
            "flagCount": len(result.flags),
        }

        response = await post_callback("/api/ai-callback/brief-scored", callback_payload)

        return {
            "brief_id": brief_id,
            "score": result.score,
            "summary": result.summary,
            "status": new_status,
            "flag_count": len(result.flags),
            "callback_response": response,
        }

    except Exception as e:
        logger.error("brief_scoring_failed", brief_id=brief_id, error=str(e))
        raise


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
