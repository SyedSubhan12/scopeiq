# AGENT-AI: AI Pipeline Audit
**Date:** 2026-04-10 | **Scope:** `apps/ai/`

## Runtime-Breaking Findings (Will Crash in Production)

### 🔴 CRITICAL: SDK Version Too Old for Claude 4
**File:** `requirements.txt`
```
anthropic==0.18.1  # Needs >=0.49.0 for claude-sonnet-4-20250514
```
The code uses `claude-sonnet-4-20250514` but the installed SDK is from early 2024 and does not know this model exists. **All AI pipelines will fail at runtime.**

### 🔴 CRITICAL: `aiohttp` Not in requirements.txt
**File:** `app/services/callback_service.py` imports `aiohttp` but it is NOT listed in `requirements.txt`. `httpx` is listed but never used. Every AI result callback will crash with `ModuleNotFoundError`.

### 🔴 CRITICAL: Zero Retry Logic on ALL LLM Calls
All four services (`brief_scorer.py`, `scope_analyzer.py`, `sow_parser.py`, `generate_change_order_worker.py`) make Anthropic API calls with no retry wrapper. A single transient 429/500 kills the job permanently.

### 🔴 CRITICAL: MatchingClause Dict Bug
**File:** `scope_guard_worker.py:70-77`
```python
# mc is a Pydantic MatchingClause object, not a dict
clause_id = mc.get("clause_id")  # AttributeError at runtime
```

## Pipeline Audit

### Brief Scoring
| Check | Status | Notes |
|---|---|---|
| tool_use mode | ✅ PASS | `tool_choice={"type":"tool","name":"score_brief"}` |
| Pydantic output validation | ✅ PASS | |
| Score range 0-100 | ✅ PASS | `Field(ge=0, le=100)` |
| Min 3 flags for score <70 | ❌ MISSING | 🟠 HIGH — no enforcement in schema or prompt |
| field_key per flag | ✅ PASS | |
| suggested_clarification_question | ✅ PASS | |
| Model pinned | ✅ PASS | `claude-sonnet-4-20250514` |
| Retry on API errors | ❌ MISSING | 🔴 CRITICAL |

### Scope Guard
| Check | Status | Notes |
|---|---|---|
| Confidence > 0.60 strictly | ✅ PASS | `>` not `>=` at `scope_guard_worker.py:81` |
| matching_clauses structure | ✅ PASS | MatchingClause Pydantic model |
| severity enum | ✅ PASS | |
| p95 SLA tracking | ✅ PASS | `SCOPE_FLAG_SLA_THRESHOLD_MS = 5000` |
| Dict access bug on MatchingClause | ❌ BUG | 🔴 CRITICAL — `.get()` on Pydantic object |
| Retry logic | ❌ MISSING | 🔴 CRITICAL |

### Change Order Generation
| Check | Status | Notes |
|---|---|---|
| Uses tool_use mode | ❌ MISSING | 🟠 HIGH — uses fragile regex JSON parsing instead |
| Pydantic output validation | ❌ MISSING | 🟠 HIGH — raw dict with `.get()` calls |
| Rate card pricing | ✅ PASS | |
| Model version | ❌ STALE | 🟠 HIGH — `claude-3-5-sonnet-20240620` vs current |

### SOW Parsing
| Check | Status | Notes |
|---|---|---|
| PDF extraction via PyMuPDF | ❌ MISSING | 🟠 HIGH — `pymupdf` installed but never imported; expects pre-extracted text |
| Clause segmentation via tool_use | ✅ PASS | |
| clause_type validation | ⚠️ PARTIAL | 🟡 MEDIUM — bare `str` not Literal enum |
| Model version | ❌ STALE | 🟠 HIGH — `claude-3-5-sonnet-20240620` |

## Worker Configuration
| Check | Status | Notes |
|---|---|---|
| Concurrency ≤ 5 | ✅ PASS | brief:5, scope:5, change-order:2, sow:2 |
| Job timeout | ❌ MISSING | 🟠 HIGH — stuck Claude calls hold slots indefinitely |
| Dead letter queue | ❌ MISSING | 🟠 HIGH — no DLQ configured |
| Structured logging | ⚠️ PARTIAL | 🟡 MEDIUM — structlog used but no Axiom sink |
| asyncio.run() pattern | ❌ DEPRECATED | 🔵 LOW — uses deprecated `get_event_loop()` |

## FastAPI Endpoints
| Check | Status | Notes |
|---|---|---|
| Health check endpoint | ❌ MISSING | 🟠 HIGH — nothing for K8s probes |
| CORS middleware | ⚠️ PARTIAL | 🟡 MEDIUM — imported but commented out |
| Bare `except: pass` | ❌ BUG | 🟡 MEDIUM — swallows KeyboardInterrupt |
| Anthropic client per-request | ❌ BAD | 🟡 MEDIUM — no connection pooling |

## Prompt Version Control
- ❌ No version headers on any prompt file
- ❌ No changelog mechanism
- All 5 prompts are unversioned

## Dependency Summary
| Issue | Fix |
|---|---|
| `anthropic==0.18.1` | Update to `>=0.49.0` |
| `aiohttp` missing | Add `aiohttp>=3.9.0` or refactor to `httpx` |
| `pymupdf` installed but unused | Remove or wire up |
| `httpx` installed but unused | Use it instead of aiohttp or remove |
