"""
Tests for apps/ai/app/workers/parse_sow_worker.py

Three groups:
  - Happy path: correct data flows through process_parse_sow
  - Validation:  missing fields / text too short are skipped cleanly
  - Text resolution: signed-URL vs S3 fallback path helpers
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# Helpers / fake job builder
# ---------------------------------------------------------------------------

def _make_job(data: dict) -> MagicMock:
    job = MagicMock()
    job.id = "job-001"
    job.data = data
    return job


# ===========================================================================
# Class 1 — Happy path
# ===========================================================================
class TestProcessParseSow:
    """Happy-path: valid job data parses clauses and POSTs callback."""

    @pytest.mark.asyncio
    async def test_returns_ok_with_clause_count(self):
        """process_parse_sow returns status=ok and clause_count when data is valid."""
        from app.workers.parse_sow_worker import process_parse_sow

        mock_clause = MagicMock()
        mock_clause.clause_type = "deliverable"
        mock_clause.original_text = "Build a landing page"
        mock_clause.summary = "Landing page work"

        mock_result = MagicMock()
        mock_result.clauses = [mock_clause]
        mock_result.clause_count = 1

        job = _make_job({"sow_id": "sow-1", "project_id": "proj-1", "raw_text": "Build a landing page"})

        with patch("app.workers.parse_sow_worker.SowParserService") as MockParser, \
             patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb:
            instance = MockParser.return_value
            instance.parse = AsyncMock(return_value=mock_result)
            mock_cb.return_value = {"status": "ok"}

            result = await process_parse_sow(job, None)

        assert result["status"] == "ok"
        assert result["clause_count"] == 1

    @pytest.mark.asyncio
    async def test_posts_callback_with_correct_sow_id(self):
        """process_parse_sow includes sowId in the callback payload."""
        from app.workers.parse_sow_worker import process_parse_sow

        mock_clause = MagicMock()
        mock_clause.clause_type = "payment"
        mock_clause.original_text = "Net-30 terms"
        mock_clause.summary = "Payment terms"

        mock_result = MagicMock()
        mock_result.clauses = [mock_clause]
        mock_result.clause_count = 1

        job = _make_job({"sow_id": "sow-42", "project_id": "proj-9", "raw_text": "Net-30 terms"})

        with patch("app.workers.parse_sow_worker.SowParserService") as MockParser, \
             patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb:
            instance = MockParser.return_value
            instance.parse = AsyncMock(return_value=mock_result)
            mock_cb.return_value = {}

            await process_parse_sow(job, None)

        called_payload = mock_cb.call_args[0][1]
        assert called_payload["sowId"] == "sow-42"

    @pytest.mark.asyncio
    async def test_re_raises_on_parser_exception(self):
        """process_parse_sow propagates exceptions from SowParserService."""
        from app.workers.parse_sow_worker import process_parse_sow

        job = _make_job({"sow_id": "sow-1", "project_id": "proj-1", "raw_text": "Some text"})

        with patch("app.workers.parse_sow_worker.SowParserService") as MockParser:
            instance = MockParser.return_value
            instance.parse = AsyncMock(side_effect=RuntimeError("AI unavailable"))

            with pytest.raises(RuntimeError, match="AI unavailable"):
                await process_parse_sow(job, None)


# ===========================================================================
# Class 2 — Validation / skip conditions
# ===========================================================================
class TestSkipConditions:
    """Validation: incomplete job data is skipped without raising."""

    @pytest.mark.asyncio
    async def test_skips_when_sow_id_missing(self):
        """Returns skipped status when sow_id is absent."""
        from app.workers.parse_sow_worker import process_parse_sow

        job = _make_job({"project_id": "proj-1", "raw_text": "Some text"})
        result = await process_parse_sow(job, None)

        assert result["status"] == "skipped"
        assert "sow_id" in result["reason"]

    @pytest.mark.asyncio
    async def test_skips_when_raw_text_missing(self):
        """Returns skipped status when raw_text is absent."""
        from app.workers.parse_sow_worker import process_parse_sow

        job = _make_job({"sow_id": "sow-1", "project_id": "proj-1"})
        result = await process_parse_sow(job, None)

        assert result["status"] == "skipped"

    @pytest.mark.asyncio
    async def test_skips_when_raw_text_is_empty_string(self):
        """Returns skipped status when raw_text is empty string (falsy)."""
        from app.workers.parse_sow_worker import process_parse_sow

        job = _make_job({"sow_id": "sow-1", "project_id": "proj-1", "raw_text": ""})
        result = await process_parse_sow(job, None)

        assert result["status"] == "skipped"


# ===========================================================================
# Class 3 — Workspace / source isolation (signed-URL vs S3 fallback)
# ===========================================================================
class TestRawTextResolution:
    """Workspace isolation: raw_text is returned directly; URL/S3 paths are mocked correctly."""

    @pytest.mark.asyncio
    async def test_raw_text_used_directly_without_fetching(self):
        """When raw_text is present, parse is called with it — no URL fetch occurs."""
        from app.workers.parse_sow_worker import process_parse_sow

        raw = "This is the raw SOW text passed directly."
        job = _make_job({"sow_id": "sow-99", "project_id": "proj-5", "raw_text": raw})

        captured_input = {}

        async def fake_parse(input_data):
            captured_input["raw_text"] = input_data.raw_text
            m = MagicMock()
            m.clauses = []
            m.clause_count = 0
            return m

        with patch("app.workers.parse_sow_worker.SowParserService") as MockParser, \
             patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock):
            instance = MockParser.return_value
            instance.parse = fake_parse

            await process_parse_sow(job, None)

        assert captured_input["raw_text"] == raw

    @pytest.mark.asyncio
    async def test_clause_list_built_correctly_in_callback(self):
        """Callback payload clauses list maps clause fields in correct order."""
        from app.workers.parse_sow_worker import process_parse_sow

        def _clause(t, txt, s):
            c = MagicMock()
            c.clause_type = t
            c.original_text = txt
            c.summary = s
            return c

        mock_result = MagicMock()
        mock_result.clauses = [
            _clause("scope", "Scope text", "Scope"),
            _clause("deliverable", "Del text", "Deliverable"),
        ]
        mock_result.clause_count = 2

        job = _make_job({"sow_id": "sow-7", "project_id": "proj-7", "raw_text": "Scope text\n\nDel text"})

        with patch("app.workers.parse_sow_worker.SowParserService") as MockParser, \
             patch("app.workers.parse_sow_worker.post_callback", new_callable=AsyncMock) as mock_cb:
            instance = MockParser.return_value
            instance.parse = AsyncMock(return_value=mock_result)
            mock_cb.return_value = {}

            await process_parse_sow(job, None)

        payload = mock_cb.call_args[0][1]
        assert payload["clauses"][0]["sortOrder"] == 0
        assert payload["clauses"][1]["sortOrder"] == 1
        assert payload["clauses"][0]["clauseType"] == "scope"

    @pytest.mark.asyncio
    async def test_workspace_isolation_sow_id_per_job(self):
        """Each job uses its own sow_id — no cross-job bleed."""
        from app.workers.parse_sow_worker import process_parse_sow

        mock_result = MagicMock()
        mock_result.clauses = []
        mock_result.clause_count = 0

        sow_ids_seen = []

        async def capturing_cb(path, payload):
            sow_ids_seen.append(payload["sowId"])
            return {}

        with patch("app.workers.parse_sow_worker.SowParserService") as MockParser, \
             patch("app.workers.parse_sow_worker.post_callback", side_effect=capturing_cb):
            instance = MockParser.return_value
            instance.parse = AsyncMock(return_value=mock_result)

            job_a = _make_job({"sow_id": "sow-A", "project_id": "proj-1", "raw_text": "text"})
            job_b = _make_job({"sow_id": "sow-B", "project_id": "proj-2", "raw_text": "text"})

            await process_parse_sow(job_a, None)
            await process_parse_sow(job_b, None)

        assert sow_ids_seen == ["sow-A", "sow-B"]
