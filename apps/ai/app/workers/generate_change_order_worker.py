import asyncio
import json
import uuid
import structlog
from bullmq import Worker

from app.config import settings
import anthropic
from app.services.callback_service import post_callback

logger = structlog.get_logger()

CHANGE_ORDER_SYSTEM_PROMPT = """
You are a professional project manager writing a formal change order for a creative agency.
Generate a change order that:
1. References the SPECIFIC SOW section that is being expanded
2. Describes the new work in concrete, unambiguous terms
3. Feels professional and collaborative — not adversarial
4. Gives the client a clear understanding of exactly what they're paying for

TONE: Professional, specific, and collegial. Never accusatory.
BAD: "This was not in scope and will cost extra."
GOOD: "This extends our engagement beyond Section 2.3 of our SOW to include X.
       Here's what we'll deliver and the investment required."

OUTPUT REQUIREMENTS:
- title: 6-10 words, action-oriented ("Social Media Template Package — 10 Formats")
- work_description: 3-5 sentences. What exactly will be delivered. What format. What timeline.
  Reference the SOW section being extended.
- estimated_hours: Realistic estimate
- pricing: amount, currency, basis (FIXED | HOURLY | DAILY_RATE)
- revised_timeline: Specific. "Extended by 5 business days from acceptance" not "more time."
- sow_reference: The clause or section this change extends (for client transparency)

Return the change order as a JSON object with these exact fields:
{
  "title": string (max 255 chars),
  "description": string (detailed explanation referencing the specific SOW section),
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
  "total_amount_cents": number,
  "scope_items": [
    {
      "clauseType": string (one of: "deliverable", "milestone", "payment", "revision", "timeline", "exclusion", "other"),
      "originalText": string (formal SOW clause text for this new scope item),
      "summary": string (brief summary of the clause),
      "sortOrder": number
    }
  ],
  "pricing_json": {
    "subtotal_cents": number,
    "tax_cents": number,
    "total_cents": number,
    "currency": "USD",
    "line_item_count": number
  }
}

Rules:
- Only include line items that match the available rate card items
- Calculate subtotals as quantity * rate_in_cents
- total_amount_cents is the sum of all line item subtotals
- pricing_json.total_cents must equal total_amount_cents
- pricing_json.tax_cents defaults to 0 unless a tax rate is apparent
- estimated_hours should be realistic for the described work
- description MUST reference the specific SOW clause or section being extended
- scope_items must be formal, client-facing SOW clause language describing the newly agreed work
"""


async def process_generate_change_order(job, token):
    """Process a change order generation job.

    Job data is pre-fetched by apps/api/src/jobs/generate-change-order.job.ts and includes:
    - scope_flag_id: UUID of the triggering scope flag
    - workspace_id: UUID of the workspace (for the callback)
    - flag_context: { title, description, ai_reasoning, severity, sow_clause }
    - project_context: { name }
    - sow_clauses: list of { id, clause_type, summary, original_text }
    - rate_card_items: list of { id, name, description, unit, rate_in_cents, currency }

    Returns a callback payload with:
    - scopeFlagId, title, description, estimatedHours, lineItems, totalAmountCents
    - scopeItemsJson: new SOW clauses to append when change order is accepted
    - pricingJson: structured pricing breakdown
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

        # Build context for the model
        clauses_context = json.dumps(sow_clauses, indent=2)
        rate_card_context = json.dumps(rate_card_items, indent=2)

        sow_clause_text = (
            flag_context.get("sow_clause") or {}
        ).get("original_text", "No specific clause linked.")

        prompt = (
            "Generate a change order for this scope deviation.\n\n"
            f"Project: {project_context.get('name', 'Unknown')}\n"
            f"Scope Flag Title: {flag_context.get('title', 'N/A')}\n"
            f"Scope Flag Description: {flag_context.get('description', 'N/A')}\n"
            f"AI Reasoning: {flag_context.get('ai_reasoning', 'N/A')}\n"
            f"Severity: {flag_context.get('severity', 'medium')}\n\n"
            f"Related SOW Clause: {sow_clause_text}\n\n"
            "All SOW Clauses:\n"
            f"{clauses_context}\n\n"
            "Available Rate Card Items:\n"
            f"{rate_card_context}\n\n"
            "Generate the change order as a JSON object."
        )

        # Call the model — this worker runs inside the BullMQ AI tier
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=CHANGE_ORDER_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        # Extract text content from response
        change_order_text = ""
        for block in response.content:
            if block.type == "text":
                change_order_text += block.text

        # Parse JSON from response
        json_start = change_order_text.find("{")
        json_end = change_order_text.rfind("}") + 1
        if json_start == -1 or json_end == 0:
            logger.error("no_json_in_response", scope_flag_id=scope_flag_id)
            return {"status": "error", "reason": "invalid AI response — no JSON object found"}

        change_order_data = json.loads(change_order_text[json_start:json_end])

        # Assign a deterministic-enough UUID for idempotency
        change_order_id = str(uuid.uuid4())
        line_items = change_order_data.get("line_items", [])
        total_amount_cents = change_order_data.get("total_amount_cents", 0)
        scope_items = change_order_data.get("scope_items", [])
        raw_pricing = change_order_data.get("pricing_json", {})
        # Normalise to camelCase so the Zod schema on the callback route
        # can validate the payload without transformation middleware.
        pricing_json = {
            "subtotalCents": raw_pricing.get("subtotal_cents", total_amount_cents),
            "taxCents": raw_pricing.get("tax_cents", 0),
            "totalCents": raw_pricing.get("total_cents", total_amount_cents),
            "currency": raw_pricing.get("currency", "USD"),
            "lineItemCount": raw_pricing.get("line_item_count", len(line_items)),
        }

        # Normalise line_items to camelCase to match the Zod callback schema.
        # The AI returns snake_case keys; the route validator expects camelCase.
        camel_line_items = [
            {
                "rateCardItemId": item.get("rate_card_item_id"),
                "rateCardName": item.get("rate_card_name", ""),
                "quantity": item.get("quantity", 0),
                "unit": item.get("unit", ""),
                "rateInCents": item.get("rate_in_cents", 0),
                "subtotalCents": item.get("subtotal_cents", 0),
            }
            for item in line_items
        ]

        # POST results to the API callback
        callback_payload = {
            "jobId": job.id,
            "scopeFlagId": scope_flag_id,
            "workspaceId": workspace_id,
            "changeOrderId": change_order_id,
            "title": change_order_data.get("title", flag_context.get("title", "Change Order")),
            "description": change_order_data.get("description", flag_context.get("description")),
            "estimatedHours": change_order_data.get("estimated_hours"),
            "lineItems": camel_line_items,
            "totalAmountCents": total_amount_cents,
            "scopeItemsJson": scope_items,
            "pricingJson": pricing_json,
        }

        response_data = await post_callback("/api/ai-callback/change-order-generated", callback_payload)

        logger.info(
            "change_order_submitted",
            change_order_id=change_order_id,
            scope_flag_id=scope_flag_id,
            amount_cents=total_amount_cents,
            scope_item_count=len(scope_items),
        )

        return {
            "status": "ok",
            "change_order_id": change_order_id,
            "title": change_order_data.get("title"),
            "amount_cents": total_amount_cents,
            "scope_item_count": len(scope_items),
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
