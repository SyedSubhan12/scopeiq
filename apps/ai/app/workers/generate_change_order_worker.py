import asyncio
import json
import structlog
from bullmq import Worker

from app.config import settings
import anthropic
from app.services.callback_service import post_callback

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


async def process_generate_change_order(job, token):
    """Process a change order generation job.

    Job data should include:
    - scope_flag_id, workspace_id (for the callback)
    - flag_context: { title, description, ai_reasoning, severity, sow_clause }
    - project_context: { name }
    - sow_clauses: [...]
    - rate_card_items: [...]
    """
    scope_flag_id = job.data.get("scope_flag_id")
    workspace_id = job.data.get("workspace_id")

    if not scope_flag_id or not workspace_id:
        logger.warning("generate_change_order_missing_data", job_id=job.id)
        return {"status": "skipped", "reason": "missing scope_flag_id or workspace_id"}

    logger.info("processing_generate_change_order", scope_flag_id=scope_flag_id)

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    try:
        # Extract pre-fetched context from job data
        flag_context = job.data.get("flag_context", {})
        project_context = job.data.get("project_context", {})
        sow_clauses = job.data.get("sow_clauses", [])
        rate_card_items = job.data.get("rate_card_items", [])

        # Build context for Claude
        clauses_context = json.dumps(sow_clauses, indent=2)
        rate_card_context = json.dumps(rate_card_items, indent=2)

        sow_clause_text = flag_context.get("sow_clause", {}).get("original_text", "No specific clause linked.")

        prompt = f"""Generate a change order for this scope deviation.

Project: {project_context.get("name", "Unknown")}
Scope Flag Title: {flag_context.get("title", "N/A")}
Scope Flag Description: {flag_context.get("description", "N/A")}
AI Reasoning: {flag_context.get("ai_reasoning", "N/A")}
Severity: {flag_context.get("severity", "medium")}

Related SOW Clause: {sow_clause_text}

All SOW Clauses:
{clauses_context}

Available Rate Card Items:
{rate_card_context}

Generate the change order as a JSON object."""

        # Call Claude
        response = await client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=4096,
            system=CHANGE_ORDER_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        # Parse Claude's response
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

        # Generate a UUID for the change order
        import uuid
        change_order_id = str(uuid.uuid4())
        line_items = change_order_json.get("line_items", [])
        total_amount_cents = change_order_json.get("total_amount_cents", 0)

        # POST results to the API callback instead of writing directly to DB
        callback_payload = {
            "jobId": job.id,
            "scopeFlagId": scope_flag_id,
            "workspaceId": workspace_id,
            "changeOrderId": change_order_id,
            "title": change_order_json.get("title", flag_context.get("title", "Change Order")),
            "description": change_order_json.get("description", flag_context.get("description")),
            "estimatedHours": change_order_json.get("estimated_hours"),
            "lineItems": line_items,
            "totalAmountCents": total_amount_cents,
        }

        response_data = await post_callback("/api/ai-callback/change-order-generated", callback_payload)

        logger.info(
            "change_order_submitted",
            change_order_id=change_order_id,
            scope_flag_id=scope_flag_id,
            amount_cents=total_amount_cents,
        )

        return {
            "status": "ok",
            "change_order_id": change_order_id,
            "title": change_order_json.get("title"),
            "amount_cents": total_amount_cents,
            "callback_response": response_data,
        }

    except Exception as e:
        logger.error("change_order_generation_failed", scope_flag_id=scope_flag_id, error=str(e))
        raise


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
