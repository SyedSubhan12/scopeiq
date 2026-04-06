---
name: senior-debugging
description: Systematic debugging skill for root-cause analysis, defect isolation, and reliability work. Use when investigating bugs, regressions, intermittent failures, performance issues, security-sensitive defects, or when reviewing code primarily for bugs and gaps.
---

# Senior Debugging

## Overview

Prefer observable facts over intuition. Reproduce the issue, isolate the failing layer, state the root cause precisely, fix the broken invariant, and prove the fix with verification.

## Workflow

1. Freeze the story: exact error, environment, timing, recent changes.
2. Reproduce with the smallest reliable path.
3. Localize by layer: UI, API, DB, queue, auth, infra.
4. State the root cause as condition, mechanism, and violated invariant.
5. Fix the mechanism or invariant, not only the symptom.
6. Verify with repro, targeted tests, and blast-radius checks.

## Evidence Checklist

- State the repro in five steps or fewer when possible.
- Determine whether the bug is deterministic or probabilistic.
- Capture the failing request, event, or log signal.
- Confirm which layer owns the defect.
- Check logs, traces, or metrics at that layer.

## Common Failure Classes

- authorization or tenant-scope leaks
- concurrency and idempotency problems
- time and timezone bugs
- null or empty-state assumptions
- swallowed errors
- N+1 queries or unbounded reads
- secrets or PII in logs
- partial failures across dependencies

## Output Standard

When reporting findings, order them by severity and include:

1. Repro or impact
2. Root-cause chain
3. Minimal fix
4. Tests
5. Residual risk

## Additional Resource

Read [references/reference.md](references/reference.md) for repro and post-incident templates.

