import asyncio
import structlog
from bullmq import Worker

from app.config import settings
from app.schemas.brief_schemas import BriefFieldInput
from app.services.brief_scorer import BriefScorerService
from app.services.callback_service import post_callback

logger = structlog.get_logger()

# Default auto-hold threshold when the caller does not supply one.
# Workspace-level override is passed via job_data["workspaceContext"]["briefScoreThreshold"]
# (populated from the workspace row by the API before dispatching).
DEFAULT_THRESHOLD = 60
DEFAULT_AUTO_HOLD_ENABLED = True


def _resolve_threshold(job_data: dict) -> int:
    """Return the effective brief-score threshold.

    Priority:
    1. job_data["workspaceContext"]["briefScoreThreshold"] — workspace admin setting
    2. job_data["threshold"]                               — legacy/direct override
    3. DEFAULT_THRESHOLD                                   — env fallback
    """
    workspace_ctx: dict = job_data.get("workspaceContext") or {}
    ws_threshold = workspace_ctx.get("briefScoreThreshold")
    if ws_threshold is not None:
        return int(ws_threshold)
    return int(job_data.get("threshold", DEFAULT_THRESHOLD))


def _resolve_auto_hold_enabled(job_data: dict) -> bool:
    """Return whether auto-hold is enabled for this workspace."""
    workspace_ctx: dict = job_data.get("workspaceContext") or {}
    enabled = workspace_ctx.get("autoHoldEnabled")
    if enabled is not None:
        return bool(enabled)
    return DEFAULT_AUTO_HOLD_ENABLED


async def process_score_brief_job(job_data: dict) -> dict:
    """Process a brief scoring job dispatched from the API via BullMQ.

    Args:
        job_data: Dict containing:
            - brief_id (str): UUID of the brief to score.
            - fields (list[dict]): Pre-fetched brief field rows from the API.
            - workspaceContext (dict, optional): Workspace AI policy fields:
                - briefScoreThreshold (int): Auto-hold threshold (overrides threshold).
                - autoHoldEnabled (bool): Whether auto-hold logic is active.
            - threshold (int, optional): Legacy per-call override (fallback).
            - job_id (str, optional): BullMQ job ID for idempotency tracking.

    Returns:
        Dict with briefId, score, summary, flags, status, flagCount, autoHold,
        and threshold — matching the shape expected by the /ai-callback/brief-scored
        endpoint (handleBriefScored in ai-callback.route.ts).
    """
    brief_id = job_data.get("brief_id")
    threshold: int = _resolve_threshold(job_data)
    auto_hold_enabled: bool = _resolve_auto_hold_enabled(job_data)
    job_id: str | None = job_data.get("job_id")

    logger.info("processing_score_brief", brief_id=brief_id, threshold=threshold)

    fields_data: list[dict] = job_data.get("fields", [])

    if not fields_data:
        logger.warning("score_brief_no_fields", brief_id=brief_id)
        callback_payload = {
            "jobId": job_id,
            "briefId": brief_id,
            "score": 0,
            "summary": "No brief fields were available for scoring.",
            "flags": [],
            "status": "clarification_needed",
            "flagCount": 0,
        }
        await post_callback("/api/ai-callback/brief-scored", callback_payload)
        return {
            "briefId": brief_id,
            "score": 0,
            "summary": "No brief fields were available for scoring.",
            "flags": [],
            "status": "clarification_needed",
            "flagCount": 0,
            "autoHold": True,
            "threshold": threshold,
        }

    fields = [
        BriefFieldInput(
            field_key=row["field_key"],
            field_type=row["field_type"],
            label=row["field_label"],
            value=row.get("value") or "",
        )
        for row in fields_data
    ]

    scorer = BriefScorerService()
    result = await asyncio.wait_for(scorer.score(fields), timeout=60.0)

    auto_hold = auto_hold_enabled and result.score < threshold
    new_status = "clarification_needed" if (auto_hold or len(result.flags) > 0) else "scored"

    logger.info(
        "brief_scored",
        brief_id=brief_id,
        score=result.score,
        threshold=threshold,
        auto_hold=auto_hold,
        flag_count=len(result.flags),
    )

    serialized_flags = [
        {
            "fieldKey": f.field_key,
            "reason": f.reason,
            "severity": f.severity,
            "suggestedQuestion": f.suggested_question,
        }
        for f in result.flags
    ]

    callback_payload = {
        "jobId": job_id,
        "briefId": brief_id,
        "score": result.score,
        "summary": result.summary,
        "flags": serialized_flags,
        "status": new_status,
        "flagCount": len(result.flags),
    }
    await post_callback("/api/ai-callback/brief-scored", callback_payload)

    return {
        "briefId": brief_id,
        "score": result.score,
        "summary": result.summary,
        "flags": serialized_flags,
        "status": new_status,
        "flagCount": len(result.flags),
        "autoHold": auto_hold,
        "threshold": threshold,
    }


async def _worker_handler(job, token):  # noqa: ARG001 — token is required by BullMQ signature
    """BullMQ processor adapter — delegates to process_score_brief_job."""
    job_data: dict = dict(job.data)
    job_data.setdefault("job_id", job.id)
    try:
        return await process_score_brief_job(job_data)
    except Exception as exc:
        logger.error(
            "brief_scoring_failed",
            brief_id=job_data.get("brief_id"),
            error=str(exc),
        )
        raise


def start_worker() -> Worker:
    """Start the BullMQ worker for brief scoring."""
    worker = Worker(
        "brief-scoring",
        _worker_handler,
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
