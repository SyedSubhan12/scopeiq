import asyncio
import time
import structlog
from bullmq import Worker

from app.config import settings
from app.schemas.scope_schemas import ScopeAnalysisInput, ScopeClauseInput
from app.services.scope_analyzer import ScopeAnalyzerService
from app.services.callback_service import post_callback

logger = structlog.get_logger()

# Performance SLA: scope flag detection within 5s p95
SCOPE_FLAG_SLA_THRESHOLD_MS = 5000

CONFIDENCE_THRESHOLD = 0.60  # Flag only when confidence > 0.60


async def process_scope_check(job, token):
    """Process a scope check job: input text vs. project SOW."""
    start_time = time.monotonic()

    message_id = job.data.get("message_id")
    project_id = job.data.get("project_id")
    input_text = job.data.get("text") or job.data.get("message_text")
    author_id = job.data.get("author_id")

    logger.info("processing_scope_check", project_id=project_id, message_id=message_id)

    analyzer = ScopeAnalyzerService()

    try:
        # NOTE: The worker no longer fetches SOW clauses from the database directly.
        # The API must include SOW clause data in the job payload or the worker
        # must call an API endpoint to fetch them. For now, we pass the job data
        # and let the scope analyzer work with what it has.
        #
        # The clauses are now expected to be fetched by the callback handler
        # or included in the job data by the API dispatcher.

        # Build a minimal analysis input — the scope analyzer service
        # will need to be adapted or the API should pre-fetch clauses.
        # For the callback pattern, the clauses are included in the response.

        # For backward compatibility during transition, we still call the analyzer
        # with whatever data is available. The analyzer should be updated separately
        # to accept pre-fetched clauses.
        clauses = job.data.get("clauses", [])
        clauses_input = [
            ScopeClauseInput(
                id=c.get("id", ""),
                clause_type=c.get("clause_type", "other"),
                summary=c.get("summary"),
                original_text=c.get("original_text", ""),
            )
            for c in clauses
        ]

        analysis_input = ScopeAnalysisInput(
            project_id=project_id,
            input_text=input_text,
            clauses=clauses_input,
        )

        result = await analyzer.analyze(analysis_input)

        duration_ms = (time.monotonic() - start_time) * 1000

        # Build matching clauses list
        matching_clauses = result.matching_clauses if hasattr(result, 'matching_clauses') and result.matching_clauses else []
        matching_clauses_list = [
            {
                "clauseId": mc.get("clause_id", mc.get("id", "")),
                "clauseText": mc.get("clause_text", mc.get("original_text", "")),
                "relevance": mc.get("relevance", mc.get("score", 0)),
            }
            for mc in matching_clauses
        ]

        # POST results to the API callback instead of writing directly to DB
        is_deviation = result.is_deviation and result.confidence > CONFIDENCE_THRESHOLD

        callback_payload = {
            "jobId": job.id,
            "messageId": message_id,
            "projectId": project_id,
            "isDeviation": is_deviation,
            "confidence": result.confidence,
            "reasoning": result.reasoning,
            "suggestedSeverity": result.suggested_severity,
            "suggestedResponse": result.suggested_response if hasattr(result, 'suggested_response') else None,
            "matchedClauseId": result.matched_clause_id if hasattr(result, 'matched_clause_id') else None,
            "matchingClauses": matching_clauses_list,
            "durationMs": round(duration_ms, 2),
            "slaMet": duration_ms < SCOPE_FLAG_SLA_THRESHOLD_MS,
        }

        response = await post_callback("/api/ai-callback/scope-checked", callback_payload)

        logger.info(
            "scope_check_completed",
            project_id=project_id,
            duration_ms=round(duration_ms, 2),
            sla_met=duration_ms < SCOPE_FLAG_SLA_THRESHOLD_MS,
            is_deviation=is_deviation,
        )

        return {
            "is_deviation": is_deviation,
            "confidence": result.confidence,
            "reasoning": result.reasoning,
            "duration_ms": round(duration_ms, 2),
            "sla_met": duration_ms < SCOPE_FLAG_SLA_THRESHOLD_MS,
            "callback_response": response,
        }

    except Exception as e:
        duration_ms = (time.monotonic() - start_time) * 1000
        logger.error(
            "scope_check_failed",
            project_id=project_id,
            duration_ms=round(duration_ms, 2),
            error=str(e),
        )
        raise


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
    worker = start_worker()
    asyncio.get_event_loop().run_forever()
