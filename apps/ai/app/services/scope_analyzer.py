import json
import anthropic
import structlog
from app.config import settings
from app.schemas.scope_schemas import ScopeAnalysisInput, ScopeAnalysisResult, ScopeClauseInput
from app.prompts.scope_guard_prompt import (
    SCOPE_GUARD_SYSTEM_PROMPT,
    SCOPE_GUARD_TOOL,
)

logger = structlog.get_logger()

class ScopeAnalyzerService:
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def analyze(self, input_data: ScopeAnalysisInput) -> ScopeAnalysisResult:
        """Analyze a text request against SOW clauses."""
        user_message = self._build_user_message(input_data)

        logger.info("analyzing_scope", project_id=input_data.project_id, clause_count=len(input_data.clauses))

        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1024,
            system=SCOPE_GUARD_SYSTEM_PROMPT,
            tools=[SCOPE_GUARD_TOOL],
            tool_choice={"type": "tool", "name": "analyze_scope"},
            messages=[{"role": "user", "content": user_message}],
        )

        for block in response.content:
            if block.type == "tool_use" and block.name == "analyze_scope":
                result = ScopeAnalysisResult(**block.input)
                logger.info(
                    "scope_analyzed",
                    project_id=input_data.project_id,
                    is_deviation=result.is_deviation,
                    confidence=result.confidence
                )
                return result

        return ScopeAnalysisResult(
            is_deviation=False,
            confidence=0.0,
            reasoning="Unable to perform semantic analysis — internal error",
            suggested_severity="low"
        )

    def _build_user_message(self, input_data: ScopeAnalysisInput) -> str:
        lines = [
            "### CLIENT REQUEST / COMMUNICATION:",
            f"{input_data.input_text}\n",
            "### PROJECT SOW CLAUSES:"
        ]
        
        for clause in input_data.clauses:
            lines.append(f"- ID: {clause.id}")
            lines.append(f"  TYPE: {clause.clause_type}")
            if clause.summary:
                lines.append(f"  SUMMARY: {clause.summary}")
            lines.append(f"  TEXT: {clause.original_text}\n")
            
        return "\n".join(lines)
