# ScopeIQ Development — Reference

## Original Claude Agents (Consolidated)

This skill consolidates 6 specialized Claude agents and 2 Cursor skills into one comprehensive full-stack development skill.

### Claude Agents Consolidated

| Agent | Model | Focus |
|-------|-------|-------|
| `tech-lead` | Opus | Architecture decisions, system design, feature planning, code review at design level |
| `frontend-dev` | Sonnet | React components, Next.js pages, hooks, forms, UI state management |
| `backend-dev` | Sonnet | API routes, repositories, services, database schemas, BullMQ jobs |
| `qa-engineer` | Sonnet | Vitest unit/integration tests, Playwright E2E, edge case analysis, test infrastructure |
| `senior-debugger` | Sonnet | Bug hunting, gap analysis, root cause investigation, SRE-style debugging |
| `devops` | Sonnet | Docker setup, CI/CD, deployment, environment configuration, migrations |

### Cursor Skills Consolidated

| Skill | Focus |
|-------|-------|
| `premium-web-animations` | Lottie integration, Framer Motion patterns, high-end UI polish, motion as information |
| `senior-debugging` | Systematic root cause analysis, evidence-based debugging, post-incident patterns, observability |

### When to Use Specialized Agents

If a task requires deep specialization in one area (e.g., complex architecture review, extensive test suite writing, or production incident debugging), the original Claude agent definitions in `.claude/agents/` can still be invoked individually for their specific expertise.

### Agent Memory Directories

- `.claude/agent-memory/backend-dev/` — Backend patterns, API decisions, query shapes
- `.claude/agent-memory/frontend-dev/` — Component patterns, UI conventions
- `.claude/agent-memory/senior-debugger/` — Bug patterns, fragile areas, conventions

These memory directories persist and should be maintained separately by each specialized agent when invoked.
