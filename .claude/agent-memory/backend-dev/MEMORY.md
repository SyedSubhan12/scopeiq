# Agent Memory Index

- [Axiom SLA metrics wiring](project_axiom_metrics.md) — where recordScopeFlagDuration is wired, why recordChangeOrderDuration is not yet wired, and the pattern for future metric calls
- [IDOR fix — portal mark-read project scoping](feedback_idor_project_scoping.md) — findById/markRead must scope on projectId + workspaceId; pattern for all portal single-row lookups
- [Rate limiter patterns and security fixes](feedback_rate_limiter_patterns.md) — ZSET sliding window, in-memory 50k cap, portal IP fallback, AI limiter fail-closed, test time-travel strategy
