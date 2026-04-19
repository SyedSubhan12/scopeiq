"""Tests for apps/ai/app/workers/score_brief_worker.py

Run with:
    cd apps/ai && python3 -m pytest tests/test_score_brief_worker.py -v
"""

import py_compile
import importlib
import pathlib
from unittest.mock import AsyncMock, patch

import pytest

# ---------------------------------------------------------------------------
# Compile check — worker must parse without errors
# ---------------------------------------------------------------------------

WORKER_PATH = str(
    pathlib.Path(__file__).parent.parent
    / "app"
    / "workers"
    / "score_brief_worker.py"
)


def test_worker_compiles():
    """Worker source must pass py_compile with no SyntaxError."""
    py_compile.compile(WORKER_PATH, doraise=True)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

HAPPY_FIELDS = [
    {
        "field_key": "project_goal",
        "field_label": "Project Goal",
        "field_type": "textarea",
        "value": "Build a customer-facing portal for onboarding new enterprise clients.",
    },
    {
        "field_key": "timeline",
        "field_label": "Timeline",
        "field_type": "text",
        "value": "8 weeks starting 2026-05-01",
    },
]

HAPPY_JOB_DATA = {
    "brief_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "job_id": "bullmq-job-001",
    "threshold": 70,
    "fields": HAPPY_FIELDS,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_score_result(score: int, flags=None):
    """Build a minimal BriefScoreResult-like object."""
    from app.schemas.brief_schemas import BriefScoreResult, BriefFlag

    resolved_flags = flags or []
    return BriefScoreResult(
        score=score,
        summary="Automated test summary.",
        flags=[
            BriefFlag(
                field_key=f["field_key"],
                reason=f["reason"],
                severity=f["severity"],
                suggested_question=f["suggested_question"],
            )
            for f in resolved_flags
        ],
    )


# ---------------------------------------------------------------------------
# Happy path — score above threshold → autoHold=False, status="scored"
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_happy_path_above_threshold_no_hold():
    """When score >= threshold and no flags, autoHold is False and status is 'scored'."""
    from app.workers.score_brief_worker import process_score_brief_job

    mock_result = _make_score_result(score=85)

    with (
        patch(
            "app.workers.score_brief_worker.BriefScorerService",
        ) as MockScorer,
        patch(
            "app.workers.score_brief_worker.post_callback",
            new_callable=AsyncMock,
        ) as mock_callback,
    ):
        instance = MockScorer.return_value
        instance.score = AsyncMock(return_value=mock_result)

        result = await process_score_brief_job(HAPPY_JOB_DATA)

    assert result["briefId"] == HAPPY_JOB_DATA["brief_id"]
    assert result["score"] == 85
    assert result["autoHold"] is False
    assert result["threshold"] == 70
    assert result["status"] == "scored"
    assert result["flagCount"] == 0

    # Callback must be called with the correct endpoint
    mock_callback.assert_awaited_once()
    endpoint_arg = mock_callback.call_args[0][0]
    assert endpoint_arg == "/api/ai-callback/brief-scored"

    callback_payload = mock_callback.call_args[0][1]
    assert callback_payload["briefId"] == HAPPY_JOB_DATA["brief_id"]
    assert callback_payload["score"] == 85
    assert callback_payload["status"] == "scored"
    assert callback_payload["jobId"] == "bullmq-job-001"


# ---------------------------------------------------------------------------
# Auto-hold path — score below threshold → autoHold=True, status="clarification_needed"
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_auto_hold_when_score_below_threshold():
    """When score < threshold, autoHold is True and status is 'clarification_needed'."""
    from app.workers.score_brief_worker import process_score_brief_job

    low_score_flags = [
        {
            "field_key": "project_goal",
            "reason": "Too vague",
            "severity": "high",
            "suggested_question": "Can you describe the measurable outcome?",
        }
    ]
    mock_result = _make_score_result(score=55, flags=low_score_flags)

    job_data = {**HAPPY_JOB_DATA, "threshold": 70}

    with (
        patch("app.workers.score_brief_worker.BriefScorerService") as MockScorer,
        patch(
            "app.workers.score_brief_worker.post_callback",
            new_callable=AsyncMock,
        ) as mock_callback,
    ):
        instance = MockScorer.return_value
        instance.score = AsyncMock(return_value=mock_result)

        result = await process_score_brief_job(job_data)

    assert result["autoHold"] is True
    assert result["status"] == "clarification_needed"
    assert result["score"] == 55
    assert result["flagCount"] == 1

    callback_payload = mock_callback.call_args[0][1]
    assert callback_payload["status"] == "clarification_needed"
    assert len(callback_payload["flags"]) == 1
    assert callback_payload["flags"][0]["fieldKey"] == "project_goal"
    assert callback_payload["flags"][0]["severity"] == "high"


# ---------------------------------------------------------------------------
# Custom threshold — caller-supplied threshold is respected
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_custom_threshold_respected():
    """threshold from job_data overrides the default."""
    from app.workers.score_brief_worker import process_score_brief_job

    mock_result = _make_score_result(score=65)

    job_data = {**HAPPY_JOB_DATA, "threshold": 60}  # score 65 > 60 → no hold

    with (
        patch("app.workers.score_brief_worker.BriefScorerService") as MockScorer,
        patch("app.workers.score_brief_worker.post_callback", new_callable=AsyncMock),
    ):
        instance = MockScorer.return_value
        instance.score = AsyncMock(return_value=mock_result)

        result = await process_score_brief_job(job_data)

    assert result["autoHold"] is False
    assert result["threshold"] == 60


# ---------------------------------------------------------------------------
# Empty fields — graceful degradation without calling scorer
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_empty_fields_handled_gracefully():
    """When fields list is empty, score is 0, autoHold is True, scorer is not called."""
    from app.workers.score_brief_worker import process_score_brief_job

    job_data = {
        "brief_id": "ffffffff-0000-1111-2222-333333333333",
        "job_id": "bullmq-job-002",
        "threshold": 70,
        "fields": [],
    }

    with (
        patch("app.workers.score_brief_worker.BriefScorerService") as MockScorer,
        patch(
            "app.workers.score_brief_worker.post_callback",
            new_callable=AsyncMock,
        ) as mock_callback,
    ):
        instance = MockScorer.return_value
        instance.score = AsyncMock()

        result = await process_score_brief_job(job_data)

    # Scorer must NOT have been called
    instance.score.assert_not_awaited()

    assert result["score"] == 0
    assert result["autoHold"] is True
    assert result["status"] == "clarification_needed"
    assert result["flagCount"] == 0

    # Callback still fires so the API marks the brief
    mock_callback.assert_awaited_once()
    callback_payload = mock_callback.call_args[0][1]
    assert callback_payload["briefId"] == job_data["brief_id"]
    assert callback_payload["status"] == "clarification_needed"
