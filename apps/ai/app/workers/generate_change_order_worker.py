import asyncio
import json
import structlog
import time
from bullmq import Worker
import asyncpg
from uuid import uuid4
from datetime import datetime, timezone

from google.genai import types

from app.config import settings
from app.gemini_client import get_gemini_client
from app.schemas.change_order_schemas import ChangeOrderOutput, ChangeOrderLineItem

logger = structlog.get_logger()

CHANGE_ORDER_SYSTEM_PROMPT = """You are a change order generator for a software development agency.

Given a scope flag (AI-detected scope deviation), the project context, SOW clauses, and rate card items,
generate a professional change order with:
- A clear title summarizing the scope change
- A detailed description explaining what is out of scope and what the change order covers
- Estimated hours for the additional work
- Pricing calculated from the rate card items

Rules:
- Only include line items that match the available rate card items
- Calculate subtotals as quantity * rate_in_cents
- total_amount_cents is the sum of all subtotals
- estimated_hours should be realistic for the described work
- description should reference the specific SOW clause being violated
- Keep the tone professional and client-facing"""

CHANGE_ORDER_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="generate_change_order",
            description="Generate a professional change order for a scope deviation",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "title": types.Schema(
                        type="STRING",
                        description="Change order title (max 255 chars)",
                    ),
                    "description": types.Schema(
                        type="STRING",
                        description="Detailed explanation of scope change and what the change order covers",
                    ),
                    "estimated_hours": types.Schema(
                        type="NUMBER",
                        description="Estimated hours for additional work",
                    ),
                    "line_items": types.Schema(
                        type="ARRAY",
                        items=types.Schema(
                            type="OBJECT",
                            properties={
                                "rate_card_item_id": types.Schema(type="STRING"),
                                "rate_card_name": types.Schema(type="STRING"),
                                "quantity": types.Schema(type="NUMBER"),
                                "unit": types.Schema(type="STRING"),
                                "rate_in_cents": types.Schema(type="INTEGER"),
                                "subtotal_cents": types.Schema(type="INTEGER"),
                            },
                            required=[
                                "rate_card_item_id",
                                "rate_card_name",
                                "quantity",
                                "unit",
                                "rate_in_cents",
                                "subtotal_cents",
                            ],
                        ),
                    ),
                    "total_amount_cents": types.Schema(
                        type="INTEGER",
                        description="Sum of all line item subtotals in cents",
                    ),
                    "revised_timeline": types.Schema(
                        type="STRING",
                        description="Optional revised timeline if this change affects delivery dates",
                    ),
                },
                required=["title", "description", "estimated_hours", "line_items", "total_amount_cents"],
            ),
        )
    ]
)

CHANGE_ORDER_CONFIG = types.GenerateContentConfig(
    system_instruction=CHANGE_ORDER_SYSTEM_PROMPT,
    tools=[CHANGE_ORDER_TOOL],
    tool_config=types.ToolConfig(
        function_calling_config=types.FunctionCallingConfig(
            mode="ANY",
            allowed_function_names=["generate_change_order"],
        )
    ),
)


async def _call_gemini_with_retry(prompt: str, max_retries: int = 3) -> types.GenerateContentResponse:
    client = get_gemini_client()
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=CHANGE_ORDER_CONFIG,
                ),
            )
            return response
        except Exception as exc:
            last_exc = exc
            if attempt < max_retries - 1:
                wait = 2 ** attempt
                logger.warning(
                    "change_order_worker_retry",
                    attempt=attempt + 1,
                    wait_seconds=wait,
                    error=str(exc),
                )
                await asyncio.sleep(wait)
    raise last_exc  # type: ignore[misc]


async def get_db_pool():
    return await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=5)


async def process_generate_change_order(job, token):
    """Process a change order generation job.

    Job data: { scope_flag_id, workspace_id }
    """
    scope_flag_id = job.data.get("scope_flag_id")
    workspace_id = job.data.get("workspace_id")

    if not scope_flag_id or not workspace_id:
        logger.warning("generate_change_order_missing_data", job_id=job.id)
        return {"status": "skipped", "reason": "missing scope_flag_id or workspace_id"}

    logger.info("processing_generate_change_order", scope_flag_id=scope_flag_id)

    pool = await get_db_pool()

    try:
        async with pool.acquire() as conn:
            # 1. Fetch the scope flag
            flag = await conn.fetchrow(
                """
                SELECT id, project_id, title, description, ai_reasoning, evidence, severity, sow_clause_id
                FROM scope_flags
                WHERE id = $1 AND workspace_id = $2
                """,
                scope_flag_id,
                workspace_id,
            )
            if not flag:
                logger.warning("scope_flag_not_found", scope_flag_id=scope_flag_id)
                return {"status": "error", "reason": "scope flag not found"}

            # 2. Fetch the project
            project = await conn.fetchrow(
                "SELECT id, name, sow_id, workspace_id FROM projects WHERE id = $1",
                flag["project_id"],
            )
            if not project:
                logger.warning("project_not_found", project_id=flag["project_id"])
                return {"status": "error", "reason": "project not found"}

            # 3. Fetch SOW clauses
            clauses_rows = []
            if project["sow_id"]:
                clauses_rows = await conn.fetch(
                    """
                    SELECT id, clause_type, summary, original_text
                    FROM sow_clauses
                    WHERE sow_id = $1
                    ORDER BY sort_order
                    """,
                    project["sow_id"],
                )

            # 4. Fetch related clause if flag has sow_clause_id
            related_clause = None
            if flag["sow_clause_id"]:
                related_clause = await conn.fetchrow(
                    "SELECT id, clause_type, summary, original_text FROM sow_clauses WHERE id = $1",
                    flag["sow_clause_id"],
                )

            # 5. Fetch rate card items
            rate_card_rows = await conn.fetch(
                """
                SELECT id, name, description, unit, rate_in_cents, currency
                FROM rate_card_items
                WHERE workspace_id = $1 AND deleted_at IS NULL
                ORDER BY name
                """,
                workspace_id,
            )

            # 6. Build context for Gemini
            clauses_context = json.dumps(
                [
                    {
                        "id": str(row["id"]),
                        "clause_type": row["clause_type"],
                        "summary": row["summary"],
                        "original_text": row["original_text"],
                    }
                    for row in clauses_rows
                ],
                indent=2,
            )

            rate_card_context = json.dumps(
                [
                    {
                        "id": str(row["id"]),
                        "name": row["name"],
                        "description": row["description"],
                        "unit": row["unit"],
                        "rate_in_cents": row["rate_in_cents"],
                        "currency": row["currency"],
                    }
                    for row in rate_card_rows
                ],
                indent=2,
            )

            prompt = f"""Generate a change order for this scope deviation.

Project: {project["name"]}
Scope Flag Title: {flag["title"]}
Scope Flag Description: {flag["description"]}
AI Reasoning: {flag["ai_reasoning"]}
Severity: {flag["severity"]}

{f'Related SOW Clause: {related_clause["original_text"]}' if related_clause else 'No specific clause linked.'}

All SOW Clauses:
{clauses_context}

Available Rate Card Items:
{rate_card_context}

Generate the change order using the generate_change_order function."""

            # 7. Call Gemini with retry + timeout
            start_ms = int(time.monotonic() * 1000)
            try:
                response = await asyncio.wait_for(
                    _call_gemini_with_retry(prompt),
                    timeout=60,
                )
            except asyncio.TimeoutError:
                logger.error(
                    "change_order_generation_timeout",
                    scope_flag_id=scope_flag_id,
                )
                return {"status": "error", "reason": "AI generation timed out"}

            # 8. Parse function call result
            func_call = response.candidates[0].content.parts[0].function_call
            raw_args = dict(func_call.args)

            raw_line_items = [dict(li) for li in list(raw_args.get("line_items", []))]
            line_items = [ChangeOrderLineItem(**li) for li in raw_line_items]

            change_order = ChangeOrderOutput(
                title=str(raw_args.get("title", flag["title"]))[:255],
                description=str(raw_args.get("description", flag["description"])),
                estimated_hours=float(raw_args.get("estimated_hours", 0.0)),
                line_items=line_items,
                total_amount_cents=int(raw_args.get("total_amount_cents", 0)),
                revised_timeline=str(raw_args["revised_timeline"]) if raw_args.get("revised_timeline") else None,
            )

            duration_ms = int(time.monotonic() * 1000) - start_ms
            logger.info(
                "change_order_ai_complete",
                scope_flag_id=scope_flag_id,
                model=settings.GEMINI_MODEL,
                duration_ms=duration_ms,
                success=True,
            )

            # 9. Insert change order into database
            change_order_id = str(uuid4())
            line_items_json = json.dumps([li.model_dump() for li in change_order.line_items])

            await conn.execute(
                """
                INSERT INTO change_orders (
                    id, workspace_id, project_id, scope_flag_id,
                    title, description, amount, currency, status,
                    line_items_json, created_by, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13)
                """,
                change_order_id,
                workspace_id,
                flag["project_id"],
                scope_flag_id,
                change_order.title,
                change_order.description,
                change_order.total_amount_cents,
                "USD",
                "draft",
                line_items_json,
                None,  # created_by (system-generated)
                datetime.now(timezone.utc),
                datetime.now(timezone.utc),
            )

            # 10. Update scope flag status to change_order_sent
            await conn.execute(
                """
                UPDATE scope_flags
                SET status = 'change_order_sent', updated_at = $1
                WHERE id = $2
                """,
                datetime.now(timezone.utc),
                scope_flag_id,
            )

            logger.info(
                "change_order_generated",
                change_order_id=change_order_id,
                scope_flag_id=scope_flag_id,
                amount_cents=change_order.total_amount_cents,
            )

            return {
                "status": "ok",
                "change_order_id": change_order_id,
                "title": change_order.title,
                "amount_cents": change_order.total_amount_cents,
            }

    except Exception as exc:
        logger.error(
            "change_order_generation_failed",
            scope_flag_id=scope_flag_id,
            error=str(exc),
        )
        raise
    finally:
        await pool.close()


def start_worker():
    worker = Worker(
        "change-order-generation",
        process_generate_change_order,
        {
            "connection": settings.REDIS_URL,
            "concurrency": 2,
        },
    )
    logger.info("generate_change_order_worker_started")
    return worker


if __name__ == "__main__":
    asyncio.run(start_worker())
