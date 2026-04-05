from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from app.config import settings

from app.schemas.clarity_schemas import ClarityPredictionInput, ClarityPredictionResult
from app.prompts.clarity_nudge_prompt import CLARITY_NUDGE_SYSTEM_PROMPT
import anthropic

app = FastAPI(title="ScopeIQ AI Service", version="0.1.0")

# ... middleware ...

@app.post("/predict-clarity", response_model=ClarityPredictionResult)
async def predict_clarity(data: ClarityPredictionInput):
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    response = await client.messages.create(
        model="claude-3-haiku-20240307", # Use fast model for real-time
        max_tokens=200,
        system=CLARITY_NUDGE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Field: {data.field_label}\nValue: {data.field_value}"}]
    )
    
    # Simple extraction (fastest for haiku without tools)
    try:
        content = response.content[0].text
        # Look for JSON in text
        import re
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            return ClarityPredictionResult(**json.loads(match.group()))
    except:
        pass
        
    return ClarityPredictionResult(score=50, feedback="Thinking...", is_clear=True)

@app.on_event("startup")
async def startup_event():
    # Initialize resources
    pass

@app.on_event("shutdown")
async def shutdown_event():
    # Cleanup resources
    pass
