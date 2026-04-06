---
name: app-dev-lead
description: Lead coordinator skill for app development. Use when planning a new app, splitting work across frontend, backend, data, QA, and release tracks, or when a feature needs phased execution with clear ownership and handoff rules.
---

# App Dev Lead

## Overview

Act as the coordinator for an app-development team. Clarify the product goal, split work into specialist tracks, define interfaces early, and sequence implementation to avoid churn.

## Team Map

- `app-product-architect`: scope, flows, app structure, feature boundaries
- `app-frontend-builder`: UI, client state, interaction flows, loading behavior
- `app-backend-builder`: APIs, services, auth, background jobs, integrations
- `app-data-modeler`: schemas, entity relationships, constraints, migrations
- `app-qa-release`: tests, acceptance criteria, release readiness, regression risk

## Operating Rules

1. Define the user outcome before choosing a technical pattern.
2. Split work by interface boundaries, not by arbitrary files.
3. Establish request and response contracts before frontend and backend diverge.
4. Keep the critical path short; delay optional polish until core behavior works.
5. Require verification criteria for each workstream before calling it done.

## Planning Output

For substantial app work, produce:

1. product goal
2. user flows
3. system slices and ownership
4. API and data contracts
5. task order
6. acceptance criteria
7. rollout and risk notes

## Additional Resource

Read [references/team-playbook.md](references/team-playbook.md) when the task spans multiple roles.

