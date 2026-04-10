import re
import json
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google.genai import types

from app.config import settings
from app.gemini_client import get_gemini_client
from app.schemas.clarity_schemas import ClarityPredictionInput, ClarityPredictionResult
from app.prompts.clarity_nudge_prompt import CLARITY_NUDGE_SYSTEM_PROMPT


CLARITY_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="predict_clarity",
            description="Predict the clarity score of a brief field response",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "score": types.Schema(
                        type="INTEGER",
                        description="Clarity score 0-100",
                    ),
                    "feedback": types.Schema(
                        type="STRING",
                        description="Single sentence of feedback or a specific question",
                    ),
                    "is_clear": types.Schema(
                        type="BOOLEAN",
                        description="True if score >= 70",
                    ),
                },
                required=["score", "feedback", "is_clear"],
            ),
        )
    ]
)

CLARITY_CONFIG = types.GenerateContentConfig(
    system_instruction=CLARITY_NUDGE_SYSTEM_PROMPT,
    tools=[CLARITY_TOOL],
    tool_config=types.ToolConfig(
        function_calling_config=types.FunctionCallingConfig(
            mode="ANY",
            allowed_function_names=["predict_clarity"],
        )
    ),
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up the singleton Gemini client on startup
    get_gemini_client()
    yield
    # Cleanup on shutdown (nothing required for stateless HTTP client)


app = FastAPI(title="ScopeIQ AI Service", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "model": settings.GEMINI_MODEL}


@app.post("/predict-clarity", response_model=ClarityPredictionResult)
async def predict_clarity(data: ClarityPredictionInput):
    client = get_gemini_client()
    prompt = f"Field: {data.field_label}\nValue: {data.field_value}"

    try:
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=CLARITY_CONFIG,
            ),
        )
        func_call = response.candidates[0].content.parts[0].function_call
        args = dict(func_call.args)
        return ClarityPredictionResult(
            score=int(args.get("score", 50)),
            feedback=str(args.get("feedback", "Thinking...")),
            is_clear=bool(args.get("is_clear", True)),
        )
    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        return ClarityPredictionResult(score=50, feedback="Thinking...", is_clear=True)
    except Exception as exc:
        return ClarityPredictionResult(score=50, feedback="Thinking...", is_clear=True)
