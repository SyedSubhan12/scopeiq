import asyncio
import json
import time
import structlog
from bullmq import Worker
import asyncpg
from uuid import uuid4

from app.config import settings
from app.gemini_client import get_gemini_client  # noqa: F401 — imported to confirm singleton pattern
from app.schemas.scope_schemas import ScopeAnalysisInput, ScopeClauseInput
from app.services.scope_analyzer import ScopeAnalyzerService

logger = structlog.get_logger()


async def get_db_pool():
    return await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=5)


async def process_scope_check(job, token):
    """Process a scope check job: input text vs. project SOW."""
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

            # 3. Confidence threshold: only flag if >= 0.60
            if result.is_deviation and result.confidence >= 0.60:
                flag_id = str(uuid4())
                # Use Pydantic attribute access (not .get()) — result is a ScopeAnalysisResult model
                await conn.execute(
                    """
                    INSERT INTO scope_flags (
                        id, workspace_id, project_id, title, description,
                        severity, status, source, metadata
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
                    """,
                    flag_id,
                    workspace_id,
                    project_id,
                    "AI Detection: Possible Scope Deviation",
                    result.reasoning,
                    result.suggested_severity,
                    "pending",
                    "ai_audit",
                    json.dumps({
                        "confidence": result.confidence,
                        "matched_clause_id": result.matched_clause_id,
                        "original_request": input_text,
                    }),
                )
                logger.info("scope_flag_created", flag_id=flag_id, confidence=result.confidence)

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
            "concurrency": 2,
        },
    )
    logger.info("scope_guard_worker_started")
    return worker


if __name__ == "__main__":
    asyncio.run(start_worker())
