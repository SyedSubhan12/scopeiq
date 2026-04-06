import asyncio
import json
import structlog
from bullmq import Worker
import asyncpg
from uuid import uuid4
from datetime import datetime, timezone

from app.config import settings
import anthropic

logger = structlog.get_logger()

CHANGE_ORDER_SYSTEM_PROMPT = """You are a change order generator for a software development agency.

Given a scope flag (AI-detected scope deviation), the project context, SOW clauses, and rate card items,
generate a professional change order with:
- A clear title summarizing the scope change
- A detailed description explaining what is out of scope and what the change order covers
- Estimated hours for the additional work
- Pricing calculated from the rate card items

Return the change order as a JSON object with these fields:
{
  "title": string (max 255 chars),
  "description": string (detailed explanation),
  "estimated_hours": number,
  "line_items": [
    {
      "rate_card_item_id": string,
      "rate_card_name": string,
      "quantity": number,
      "unit": string,
      "rate_in_cents": number,
      "subtotal_cents": number
    }
  ],
  "total_amount_cents": number
}

Rules:
- Only include line items that match the available rate card items
- Calculate subtotals as quantity * rate_in_cents
- total_amount_cents is the sum of all subtotals
- estimated_hours should be realistic for the described work
- description should reference the specific SOW clause being violated
- Keep the tone professional and client-facing
"""


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
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

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

            # 6. Build context for Claude
            clauses_context = json.dumps([
                {
                    "id": str(row["id"]),
                    "clause_type": row["clause_type"],
                    "summary": row["summary"],
                    "original_text": row["original_text"],
                }
                for row in clauses_rows
            ], indent=2)

            rate_card_context = json.dumps([
                {
                    "id": str(row["id"]),
                    "name": row["name"],
                    "description": row["description"],
                    "unit": row["unit"],
                    "rate_in_cents": row["rate_in_cents"],
                    "currency": row["currency"],
                }
                for row in rate_card_rows
            ], indent=2)

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

Generate the change order as a JSON object."""

            # 7. Call Claude
            response = await client.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=4096,
                system=CHANGE_ORDER_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )

            # 8. Parse Claude's response
            change_order_text = ""
            for block in response.content:
                if block.type == "text":
                    change_order_text += block.text

            # Extract JSON from response
            json_start = change_order_text.find("{")
            json_end = change_order_text.rfind("}") + 1
            if json_start == -1 or json_end == 0:
                logger.error("no_json_in_claude_response", scope_flag_id=scope_flag_id)
                return {"status": "error", "reason": "invalid AI response"}

            change_order_json = json.loads(change_order_text[json_start:json_end])

            # 9. Insert change order into database
            change_order_id = str(uuid4())
            line_items = change_order_json.get("line_items", [])
            total_amount_cents = change_order_json.get("total_amount_cents", 0)

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
                change_order_json.get("title", flag["title"]),
                change_order_json.get("description", flag["description"]),
                total_amount_cents,
                "USD",
                "draft",
                json.dumps(line_items),
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
                amount_cents=total_amount_cents,
            )

            return {
                "status": "ok",
                "change_order_id": change_order_id,
                "title": change_order_json.get("title"),
                "amount_cents": total_amount_cents,
            }

    except Exception as e:
        logger.error("change_order_generation_failed", scope_flag_id=scope_flag_id, error=str(e))
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
    worker = start_worker()
    asyncio.get_event_loop().run_forever()
