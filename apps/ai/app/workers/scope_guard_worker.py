import asyncio
import time
import structlog
import asyncpg
from bullmq import Worker

from app.config import settings
from app.gemini_client import get_gemini_client  # noqa: F401 — imported to confirm singleton pattern
from app.schemas.scope_schemas import ScopeAnalysisInput, ScopeClauseInput
from app.services.scope_analyzer import ScopeAnalyzerService
from app.services.callback_service import post_callback

logger = structlog.get_logger()

# v2 post-processing rules (from scope_guard_prompt.py):
# - Create scope_flag ONLY if: is_in_scope=False AND confidence > 0.60
# - Confidence 0.61-0.74 → severity capped at LOW regardless of AI output
CONFIDENCE_MIN = 0.60  # Below this is noise — never flag (v2: raised from 0.30)
CONFIDENCE_LOW_CAP = 0.74  # At or below this → severity capped at LOW
CONFIDENCE_HIGH = 0.90  # v2 calibration: 0.90+ = SOW explicitly excludes by name
CONFIDENCE_MEDIUM = 0.75  # v2 calibration: 0.75-0.89 = specific scope mismatch
SLA_LATENCY_MS = 5000

# Default scope-guard confidence threshold when workspace has no override.
# Workspace admin can raise/lower this via the AI policy settings.
DEFAULT_SCOPE_GUARD_THRESHOLD = 0.60


def _resolve_scope_guard_threshold(job_data: dict) -> float:
    """Return the effective scope-guard confidence threshold.

    Priority:
    1. job.data["workspaceContext"]["scopeGuardThreshold"] — workspace admin setting (decimal string)
    2. DEFAULT_SCOPE_GUARD_THRESHOLD                       — env fallback
    """
    workspace_ctx: dict = job_data.get("workspaceContext") or {}
    raw = workspace_ctx.get("scopeGuardThreshold")
    if raw is not None:
        try:
            value = float(raw)
            if 0.0 <= value <= 1.0:
                return value
        except (TypeError, ValueError):
            pass
    return DEFAULT_SCOPE_GUARD_THRESHOLD


def severity_for_confidence(confidence: float, fallback: str) -> str:
    if confidence >= CONFIDENCE_HIGH:
        return "high"
    if confidence >= CONFIDENCE_MEDIUM:
        return "medium"
    if confidence >= CONFIDENCE_MIN:
        return "low"
    return fallback


async def get_db_pool():
    return await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=5)


async def process_scope_check(job, token):
    """Process a scope check job: input text vs. project SOW."""
    start_time = time.monotonic()

    job_data: dict = dict(job.data)
    scope_guard_threshold: float = _resolve_scope_guard_threshold(job_data)

    message_id = job.data.get("message_id")
    project_id = job.data.get("project_id")
    input_text = job.data.get("text")
    author_id = job.data.get("author_id")  # Optional tracking

    logger.info("processing_scope_check", project_id=project_id)

    analyzer = ScopeAnalyzerService()
    pool = await get_db_pool()
    start_ms = int(time.monotonic() * 1000)

    try:
        async with pool.acquire() as conn:
            # 1. Fetch SOW clauses for the project
            project = await conn.fetchrow(
                "SELECT sow_id, workspace_id FROM projects WHERE id = $1", project_id
            )
            if not project or not project["sow_id"]:
                logger.warning("no_sow_for_project", project_id=project_id)
                return {"status": "no_sow"}

            workspace_id = project["workspace_id"]

            clauses_rows = await conn.fetch(
                "SELECT id, clause_type, summary, original_text FROM sow_clauses WHERE sow_id = $1",
                project["sow_id"],
            )

            clauses = [
                ScopeClauseInput(
                    id=str(row["id"]),
                    clause_type=row["clause_type"],
                    summary=row["summary"],
                    original_text=row["original_text"],
                )
                for row in clauses_rows
            ]

            # 2. Analyze with timeout
            analysis_input = ScopeAnalysisInput(
                project_id=project_id,
                input_text=input_text,
                clauses=clauses,
            )

            try:
                result = await asyncio.wait_for(
                    analyzer.analyze(analysis_input),
                    timeout=30,
                )
            except asyncio.TimeoutError:
                duration_ms = int(time.monotonic() * 1000) - start_ms
                logger.error(
                    "scope_check_timeout",
                    project_id=project_id,
                    model=settings.GEMINI_MODEL,
                    duration_ms=duration_ms,
                    success=False,
                )
                return {"status": "error", "reason": "AI analysis timed out"}

            duration_ms = int(time.monotonic() * 1000) - start_ms
            logger.info(
                "scope_checked",
                project_id=project_id,
                is_deviation=result.is_deviation,
                confidence=result.confidence,
                model=settings.GEMINI_MODEL,
                duration_ms=duration_ms,
                success=True,
            )

            # 3. v2 post-processing rules: drop noise below CONFIDENCE_MIN (0.60),
            #    cap severity to LOW for borderline confidence (0.61-0.74),
            #    bucket remaining severity by confidence so UX matches AI certainty.
            # Also respect workspace-level scopeGuardThreshold — flags are only
            # created when confidence meets or exceeds the workspace admin's setting.
            effective_min = max(CONFIDENCE_MIN, scope_guard_threshold)
            sla_ok = duration_ms <= SLA_LATENCY_MS

            if result.is_deviation and result.confidence > effective_min:
                tuned_severity = severity_for_confidence(
                    result.confidence,
                    fallback=result.suggested_severity,
                )
                # v2 rule: confidence 0.61-0.74 → severity capped at LOW
                if result.confidence <= CONFIDENCE_LOW_CAP:
                    tuned_severity = "low"
            elif result.is_deviation:
                # v2: confidence did not exceed threshold — log but do not create flag
                logger.info(
                    "scope_flag_dropped_low_confidence",
                    project_id=project_id,
                    confidence=result.confidence,
                    effective_min=effective_min,
                    scope_guard_threshold=scope_guard_threshold,
                )
                tuned_severity = None
            else:
                tuned_severity = None

            # Post results back to the API callback — the API owns all DB writes,
            # including the atomic scope_flag + system message insert (FR-SG-002).
            # The worker must NOT write directly to scope_flags or messages tables.
            job_id = job_data.get("job_id")
            callback_payload = {
                "jobId": job_id,
                "messageId": message_id,
                "projectId": project_id,
                "isDeviation": result.is_deviation,
                "confidence": result.confidence,
                "reasoning": result.reasoning,
                "suggestedSeverity": tuned_severity,
                "suggestedResponse": result.suggested_response if hasattr(result, "suggested_response") else None,
                "matchedClauseId": result.matched_clause_id if hasattr(result, "matched_clause_id") else None,
                "matchingClauses": [
                    {
                        "clauseId": mc.id if hasattr(mc, "id") else str(mc),
                        "clauseText": mc.original_text if hasattr(mc, "original_text") else "",
                        "relevance": mc.relevance if hasattr(mc, "relevance") else 0,
                    }
                    for mc in (result.matching_clauses if hasattr(result, "matching_clauses") else [])
                ],
                "durationMs": duration_ms,
                "slaMet": sla_ok,
            }
            await post_callback("/api/ai-callback/scope-checked", callback_payload)
            logger.info(
                "scope_check_callback_posted",
                project_id=project_id,
                is_deviation=result.is_deviation,
                confidence=result.confidence,
                severity=tuned_severity,
                detection_latency_ms=duration_ms,
                sla_ok=sla_ok,
            )

            return {
                "is_deviation": result.is_deviation,
                "confidence": result.confidence,
                "reasoning": result.reasoning,
            }

    except Exception as exc:
        duration_ms = int(time.monotonic() * 1000) - start_ms
        logger.error(
            "scope_check_failed",
            project_id=project_id,
            error=str(exc),
            model=settings.GEMINI_MODEL,
            duration_ms=duration_ms,
            success=False,
        )
        raise
    finally:
        await pool.close()


def start_worker():
    worker = Worker(
        "scope-check",
        process_scope_check,
        {
            "connection": settings.REDIS_URL,
            "concurrency": 5,  # Max 5 concurrent Claude API calls per worker
        },
    )
    logger.info("scope_guard_worker_started")
    return worker


if __name__ == "__main__":
    asyncio.run(start_worker())
