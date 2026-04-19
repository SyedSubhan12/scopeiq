"""Tests for apps/ai/app/workers/parse_sow_worker.py

Run with:
    cd apps/ai && python3 -m pytest tests/test_parse_sow_worker.py -v
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.schemas.sow_schemas import SowParsingResult, SowClauseOutput

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SAMPLE_RAW_TEXT = (
    "The agency will deliver a responsive website redesign. "
    "The client is entitled to 2 rounds of revisions. "
    "The project timeline is 8 weeks. "
    "Excluded from scope: SEO optimisation, paid ads, third-party integrations. "
    "Payment terms: 50% upfront, 50% on delivery."
)

SAMPLE_CLAUSES = [
    SowClauseOutput(clause_type="deliverable", original_text="responsive website redesign", summary="Website redesign deliverable"),
    SowClauseOutput(clause_type="revision_limit", original_text="2 rounds of revisions", summary="2 revision rounds"),
    SowClauseOutput(clause_type="timeline", original_text="8 weeks", summary="8-week timeline"),
    SowClauseOutput(clause_type="exclusion", original_text="SEO, ads, integrations excluded", summary="Out-of-scope items"),
    SowClauseOutput(clause_type="payment_term", original_text="50% upfront, 50% on delivery", summary="Payment schedule"),
]


def _make_parse_result(clauses=None) -> SowParsingResult:
    resolved = clauses if clauses is not None else SAMPLE_CLAUSES
    return SowParsingResult(sow_id="sow-001", clauses=resolved, clause_count=len(resolved))


def _make_job(sow_id: str = "sow-001", project_id: str = "proj-001", raw_text: str = SAMPLE_RAW_TEXT):
    job = MagicMock()
    job.id = "bullmq-job-sow-01"
    job.data = {
        "sow_id": sow_id,
        "project_id": project_id,
        "raw_text": raw_text,
    }
    return job


# ===========================================================================
# describe: Happy path — raw_text provided, Gemini returns clauses
# ===========================================================================

class TestHappyPath:
    @pytest.mark.asyncio
    async def test_returns_ok_status_with_clause_count(self):
        """Worker returns ok status and correct clause_count when parse succeeds."""
        from app.workers.parse_sow_worker import process_parse_sow

        mock_result = _make_parse_result()

        with (
            patch("app.workers.parse_sow_worker.SowParserService") as MockParser,
            patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb,
        ):
            instance = MockParser.return_value
            instance.parse = AsyncMock(return_value=mock_result)

            result = await process_parse_sow(_make_job(), token=None)

        assert result["status"] == "ok"
        assert result["clause_count"] == len(SAMPLE_CLAUSES)

    @pytest.mark.asyncio
    async def test_callback_payload_shape(self):
        """Callback to /api/ai-callback/sow-parsed receives correct keys and clause array shape."""
        from app.workers.parse_sow_worker import process_parse_sow

        mock_result = _make_parse_result()

        with (
            patch("app.workers.parse_sow_worker.SowParserService") as MockParser,
            patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb,
        ):
            instance = MockParser.return_value
            instance.parse = AsyncMock(return_value=mock_result)

            await process_parse_sow(_make_job(), token=None)

        mock_cb.assert_awaited_once()
        endpoint = mock_cb.call_args[0][0]
        payload = mock_cb.call_args[0][1]

        assert endpoint == "/api/ai-callback/sow-parsed"
        assert payload["sowId"] == "sow-001"
        assert payload["projectId"] == "proj-001"
        assert isinstance(payload["clauses"], list)
        assert len(payload["clauses"]) == len(SAMPLE_CLAUSES)

    @pytest.mark.asyncio
    async def test_clause_objects_have_required_keys(self):
        """Each emitted clause has clauseType, originalText, summary, and sortOrder."""
        from app.workers.parse_sow_worker import process_parse_sow

        mock_result = _make_parse_result()

        with (
            patch("app.workers.parse_sow_worker.SowParserService") as MockParser,
            patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb,
        ):
            instance = MockParser.return_value
            instance.parse = AsyncMock(return_value=mock_result)

            await process_parse_sow(_make_job(), token=None)

        payload = mock_cb.call_args[0][1]
        first_clause = payload["clauses"][0]
        assert "clauseType" in first_clause
        assert "originalText" in first_clause
        assert "summary" in first_clause
        assert "sortOrder" in first_clause
        assert first_clause["sortOrder"] == 0

    @pytest.mark.asyncio
    async def test_clause_types_are_valid_enum_values(self):
        """All emitted clauseType values are members of the allowed enum."""
        from app.workers.parse_sow_worker import process_parse_sow

        valid_types = {"deliverable", "revision_limit", "timeline", "exclusion", "payment_term", "other"}
        mock_result = _make_parse_result()

        with (
            patch("app.workers.parse_sow_worker.SowParserService") as MockParser,
            patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb,
        ):
            instance = MockParser.return_value
            instance.parse = AsyncMock(return_value=mock_result)

            await process_parse_sow(_make_job(), token=None)

        payload = mock_cb.call_args[0][1]
        for clause in payload["clauses"]:
            assert clause["clauseType"] in valid_types


# ===========================================================================
# describe: Validation errors — bad/missing inputs
# ===========================================================================

class TestValidationErrors:
    @pytest.mark.asyncio
    async def test_missing_sow_id_returns_skipped(self):
        """Job with no sow_id is skipped without calling parser or callback."""
        from app.workers.parse_sow_worker import process_parse_sow

        job = MagicMock()
        job.id = "bullmq-job-nosow"
        job.data = {"project_id": "proj-001", "raw_text": SAMPLE_RAW_TEXT}

        with (
            patch("app.workers.parse_sow_worker.SowParserService") as MockParser,
            patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb,
        ):
            result = await process_parse_sow(job, token=None)

        assert result["status"] == "skipped"
        assert "sow_id" in result["reason"]
        mock_cb.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_insufficient_text_returns_skipped(self):
        """Job with raw_text shorter than minimum is skipped gracefully."""
        from app.workers.parse_sow_worker import process_parse_sow

        job = _make_job(raw_text="Too short")

        with (
            patch("app.workers.parse_sow_worker.SowParserService") as MockParser,
            patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb,
        ):
            result = await process_parse_sow(job, token=None)

        assert result["status"] == "skipped"
        assert "insufficient_text" in result["reason"]
        mock_cb.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_empty_raw_text_returns_skipped(self):
        """Empty raw_text skips gracefully without raising."""
        from app.workers.parse_sow_worker import process_parse_sow

        job = _make_job(raw_text="")

        with (
            patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb,
        ):
            result = await process_parse_sow(job, token=None)

        assert result["status"] == "skipped"
        mock_cb.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_parser_exception_propagates(self):
        """When SowParserService.parse raises, the worker re-raises for BullMQ retry."""
        from app.workers.parse_sow_worker import process_parse_sow

        with (
            patch("app.workers.parse_sow_worker.SowParserService") as MockParser,
            patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock),
        ):
            instance = MockParser.return_value
            instance.parse = AsyncMock(side_effect=ValueError("Gemini timeout"))

            with pytest.raises(ValueError, match="Gemini timeout"):
                await process_parse_sow(_make_job(), token=None)


# ===========================================================================
# describe: Workspace isolation — sow_id from a different workspace is opaque to the worker
# ===========================================================================

class TestWorkspaceIsolation:
    @pytest.mark.asyncio
    async def test_sow_id_is_forwarded_verbatim_in_callback(self):
        """The worker passes sow_id from job_data to callback unchanged — no server-side ws check."""
        from app.workers.parse_sow_worker import process_parse_sow

        foreign_sow_id = "foreign-sow-9999"
        mock_result = _make_parse_result()

        with (
            patch("app.workers.parse_sow_worker.SowParserService") as MockParser,
            patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb,
        ):
            instance = MockParser.return_value
            instance.parse = AsyncMock(return_value=mock_result)

            await process_parse_sow(_make_job(sow_id=foreign_sow_id), token=None)

        payload = mock_cb.call_args[0][1]
        assert payload["sowId"] == foreign_sow_id

    @pytest.mark.asyncio
    async def test_two_concurrent_jobs_emit_separate_callbacks(self):
        """Two jobs with distinct sow_ids each emit a separate callback with their own sowId."""
        from app.workers.parse_sow_worker import process_parse_sow
        import asyncio

        mock_result = _make_parse_result()
        calls = []

        async def capture_callback(endpoint, payload):
            calls.append(payload["sowId"])

        with (
            patch("app.workers.parse_sow_worker.SowParserService") as MockParser,
            patch("app.workers.parse_sow_worker.post_callback", side_effect=capture_callback),
        ):
            instance = MockParser.return_value
            instance.parse = AsyncMock(return_value=mock_result)

            await asyncio.gather(
                process_parse_sow(_make_job(sow_id="sow-alpha"), token=None),
                process_parse_sow(_make_job(sow_id="sow-beta"), token=None),
            )

        assert set(calls) == {"sow-alpha", "sow-beta"}
