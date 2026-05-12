---
name: Axiom SLA metrics wiring
description: How and where Axiom metric calls are wired into the AI callback route, and what is NOT wired yet
type: project
---

`recordScopeFlagDuration` is called in `/api/ai-callback/scope-checked` (ai-callback.route.ts) **after** the DB transaction and before the response return. The Python worker (`scope_guard_worker.py`) computes `durationMs` as wall-clock ms of the AI analysis (`int(time.monotonic() * 1000) - start_ms`) and `slaMet` as `duration_ms <= 5000`. Both arrive as optional fields on the Zod schema.

The Axiom call is guarded with `if (payload.durationMs != null)` so it is a no-op when the field is absent. It is synchronous (buffered, fire-and-forget) — no `await`, no `.catch()` needed.

`recordChangeOrderDuration` is NOT yet wired because `changeOrderGeneratedSchema` carries no `durationMs` field — the change-order worker does not send timing data back in its callback payload. To wire it, the Python change-order worker must add `durationMs` + `slaMet` to its callback payload first.

**Why:** Axiom lib functions are void/fire-and-forget; they must live outside DB transactions (pure I/O). Do not change the axiom.ts function signatures — the lib is shared.

**How to apply:** Any future metric call (e.g. brief scoring duration) follows the same pattern: optional field in Zod schema, null-guard, call outside transaction.
