import asyncio
from contextlib import asynccontextmanager

import structlog
from anthropic import APIError
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.anthropic_client import get_anthropic_client
from app.config import settings
from app.schemas.clarity_schemas import ClarityPredictionInput, ClarityPredictionResult
from app.prompts.clarity_nudge_prompt import CLARITY_NUDGE_SYSTEM_PROMPT


logger = structlog.get_logger()


CLARITY_TOOL = {
    "name": "predict_clarity",
    "description": "Predict the clarity score of a brief field response",
    "input_schema": {
        "type": "object",
        "properties": {
            "score": {"type": "integer", "description": "Clarity score 0-100"},
            "feedback": {
                "type": "string",
                "description": "Single sentence of feedback or a specific question",
            },
            "is_clear": {"type": "boolean", "description": "True if score >= 70"},
        },
        "required": ["score", "feedback", "is_clear"],
    },
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # FIND-013: validate Anthropic credentials at boot with a 1-token ping so
    # the container fails liveness instead of returning safe-default verdicts on
    # every request after the first one.
    client = get_anthropic_client()
    try:
        await client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=1,
            messages=[{"role": "user", "content": "ping"}],
        )
        logger.info("anthropic_boot_probe_ok", model=settings.ANTHROPIC_MODEL)
    except APIError as exc:
        logger.error(
            "anthropic_boot_probe_failed",
            model=settings.ANTHROPIC_MODEL,
            error=str(exc),
        )
        raise RuntimeError(
            "ANTHROPIC_API_KEY is invalid or the model is unreachable. "
            "Refusing to start FastAPI; fix credentials before retrying."
        ) from exc
    yield


app = FastAPI(title="ScopeIQ AI Service", version="0.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "model": settings.ANTHROPIC_MODEL}


@app.post("/predict-clarity", response_model=ClarityPredictionResult)
async def predict_clarity(data: ClarityPredictionInput):
    client = get_anthropic_client()
    user_prompt = f"Field: {data.field_label}\nValue: {data.field_value}"

    try:
        response = await client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=512,
            system=CLARITY_NUDGE_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            tools=[CLARITY_TOOL],
            tool_choice={"type": "tool", "name": "predict_clarity"},
        )
        for block in response.content:
            if getattr(block, "type", None) == "tool_use":
                args = block.input
                return ClarityPredictionResult(
                    score=int(args.get("score", 50)),
                    feedback=str(args.get("feedback", "Thinking...")),
                    is_clear=bool(args.get("is_clear", True)),
                )
        # Tool was not invoked — surface as 502 so callers can retry.
        raise HTTPException(status_code=502, detail="Claude did not return tool_use")
    except APIError as exc:
        # Surface upstream failures so the BullMQ worker can retry.
        logger.error("predict_clarity_anthropic_error", error=str(exc))
        raise HTTPException(status_code=502, detail="Anthropic upstream error") from exc
