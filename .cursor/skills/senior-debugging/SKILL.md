---
name: senior-debugging
description: Systematically finds root causes of bugs, errors, and reliability gaps; validates fixes with evidence and tests; applies production-grade practices (SRE-style isolation, observability, safe rollouts). Use when debugging failures, intermittent issues, regressions, performance problems, security-sensitive bugs, or when the user asks for deep code review focused on defects and gaps.
---

# Senior debugging

## Mindset

- **Symptoms lie; hypotheses must be falsified.** Do not ship a fix because it “seems right”—prove the failure mode and prove the fix removes it.
- **Change one variable at a time.** Multiple simultaneous edits destroy causality.
- **Prefer observable facts** (logs, traces, repro steps, minimal repro, failing test) over intuition.

## Workflow (always)

1. **Freeze the story**
   - Exact error text, status codes, stack traces, timestamps, environment (dev/stage/prod), commit SHA, feature flags.
   - What changed recently? (deploy, dependency, config, data.)

2. **Reproduce**
   - Smallest path that triggers the bug. If not reproducible, define **frequency**, **correlation** (user, region, tenant, job type), and **boundary** (first seen / last good).

3. **Localize**
   - Narrow from “the app” → service → handler → function → line.
   - Use bisection (git), binary search in config/data, divide logging at layer boundaries.

4. **Root cause**
   - State cause as: *Under condition X, component Y does Z, violating invariant W.*
   - Separate **trigger** (input) from **mechanism** (code path) from **missing guard** (why it wasn’t caught).

5. **Fix**
   - Fix the **invariant** or the **mechanism**, not only the symptom (e.g. don’t only retry if the bug is corrupt state).
   - Add a **regression test** or automated check when the class of bug is likely to return.

6. **Verify**
   - Re-run repro → pass.
   - Run targeted tests + relevant integration/E2E.
   - Consider blast radius: migrations, caches, async jobs, idempotency.

## Evidence checklist

- [ ] Can state repro in ≤5 steps (or documented why impossible).
- [ ] Know whether failure is **deterministic** or **probabilistic**.
- [ ] Captured **request/response** or **event** that proves the bad behavior.
- [ ] Confirmed **which layer** owns the bug (client, API, DB, queue, CDN, DNS, auth).
- [ ] Checked **logs/metrics/traces** at that layer (not only the UI message).

## Big-tech style patterns (use when applicable)

| Pattern | When |
|--------|------|
| **Feature flag / kill switch** | Stop bleeding in prod; narrow to cohort; verify fix under flag. |
| **Canary + automatic rollback** | Detect regression via SLO/error budget spikes. |
| **Idempotency keys** | Duplicate submits, webhook retries, queue redelivery. |
| **Timeouts + cancellation** | Cascading latency, hung workers, thread pool exhaustion. |
| **Backpressure & limits** | Queue depth, rate limits, bulkhead between dependencies. |
| **Graceful degradation** | Fallback UI, stale cache read, read-only mode. |
| **Post-incident** | Timeline, root cause, corrective + preventive actions, action owners. |

## Common gap classes (scan for these)

- **AuthZ**: authenticated but not authorized; missing tenant/workspace scope on queries.
- **Concurrency**: race, TOCTOU, non-atomic read-modify-write.
- **Time**: timezones, DST, “now” in tests, TTL vs wall clock.
- **Null/empty**: optional chains hiding bad assumptions; empty arrays vs undefined.
- **Type coercion**: string vs number IDs; loose equality.
- **Error swallowing**: empty `catch`, generic handlers that lose context.
- **N+1 / unbounded queries**: missing `limit`, missing index, fan-out in loops.
- **Secrets & PII**: logs, client bundles, exception reports.
- **Partial failure**: one dependency fails; does the whole operation fail safely?

## Code review for defects (output format)

When reviewing or reporting:

1. **Repro / impact** — who/what breaks, severity (data loss, security, outage, UX).
2. **Root cause chain** — trigger → mechanism → invariant breach.
3. **Fix** — minimal diff, why it restores the invariant.
4. **Tests** — unit for logic, integration for I/O, E2E if user journey.
5. **Residual risk** — what is still not proven; what to monitor.

Use severity labels:

- **P0** — security, data corruption, widespread outage, money/legal exposure.
- **P1** — major feature broken, no workaround.
- **P2** — incorrect behavior with workaround.
- **P3** — cosmetic, minor edge case.

## Anti-patterns (avoid)

- “Fixed” without repro or test.
- Explaining the bug by citing docs instead of observed behavior.
- Adding retries to hide **400**s caused by bad client payloads.
- Broad refactors mixed with bugfix in one change.
- Assuming production === local without checking config, data volume, and latency.

## ScopeIQ constraints (do not violate)

- Tenant isolation: **`workspaceId` in queries**; no cross-tenant reads/writes.
- No raw SQL strings; Drizzle only.
- No client-side secrets; AI only via gateway/apps/ai patterns per repo rules.
- Mutations with **`writeAuditLog`** in the same transaction when applicable.

## Additional resources

- Deeper incident and postmortem templates: [reference.md](reference.md)
