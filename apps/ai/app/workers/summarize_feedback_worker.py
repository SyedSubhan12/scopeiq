import asyncio
import json
import structlog
from bullmq import Worker

from app.config import settings
from app.schemas.feedback_schemas import FeedbackItemInput
from app.services.feedback_summarizer import FeedbackSummarizerService
from app.services.callback_service import post_callback

logger = structlog.get_logger()


async def process_summarize_feedback(job, token):
    """Process a feedback summarization job from the queue."""
    deliverable_id = job.data.get("deliverable_id")
    logger.info("processing_summarize_feedback", deliverable_id=deliverable_id)

    summarizer = FeedbackSummarizerService()

    # Feedback items should be pre-fetched and included in the job data
    # by the API dispatcher to avoid direct DB access.
    feedback_data = job.data.get("feedback_items", [])

    try:
        if not feedback_data:
            # No feedback available — return empty result via callback
            callback_payload = {
                "jobId": job.id,
                "deliverableId": deliverable_id,
                "tasks": [],
                "overallNotes": "No feedback found.",
                "taskCount": 0,
            }
            response = await post_callback("/api/ai-callback/feedback-summarized", callback_payload)
            return {
                "deliverable_id": deliverable_id,
                "task_count": 0,
                "overall_notes": "No feedback found.",
                "callback_response": response,
            }

        items = []
        for row in feedback_data:
            annotation = row.get("annotation_json", {}) or {}
            if isinstance(annotation, str):
                annotation = json.loads(annotation)
            items.append(
                FeedbackItemInput(
                    pin_number=annotation.get("pin_number", 0),
                    x_pos=float(annotation.get("x_pos", 0.0)),
                    y_pos=float(annotation.get("y_pos", 0.0)),
                    content=row["body"],
                    author_type=row.get("source", "portal"),
                    page_number=annotation.get("page_number"),
                )
            )

        result = await summarizer.summarize(items)

        logger.info(
            "feedback_summarized",
            deliverable_id=deliverable_id,
            task_count=len(result.tasks),
        )

        # POST results to the API callback instead of writing directly to DB
        callback_payload = {
            "jobId": job.id,
            "deliverableId": deliverable_id,
            "tasks": [
                {
                    "action": t.action,
                    "impact": t.impact,
                    "sourcePin": t.source_pin,
                    "contradiction": t.contradiction,
                    "conflictExplanation": t.conflict_explanation,
                }
                for t in result.tasks
            ],
            "overallNotes": result.overall_notes,
            "taskCount": len(result.tasks),
        }

        response = await post_callback("/api/ai-callback/feedback-summarized", callback_payload)

        return {
            "deliverable_id": deliverable_id,
            "task_count": len(result.tasks),
            "overall_notes": result.overall_notes,
            "callback_response": response,
        }

    except Exception as e:
        logger.error("feedback_summarization_failed", deliverable_id=deliverable_id, error=str(e))
        raise


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
