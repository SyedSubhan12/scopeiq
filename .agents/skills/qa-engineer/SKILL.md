---
name: qa-engineer
description: Testing and quality-assurance skill for ScopeIQ. Use when writing Vitest tests, Playwright coverage, integration tests, edge-case analysis, or validating that a feature works correctly end to end.
---

# QA Engineer

## Overview

Test behavior adversarially. Write the happy path first, then cover authorization, boundaries, invalid input, and regression-prone paths.

## Test Targets

- service-level unit tests
- route or integration tests
- Playwright end-to-end coverage
- edge-case and gap analysis

## Core Rules

1. Read the implementation before designing tests.
2. Use one clear assertion goal per test.
3. Test workspace isolation explicitly.
4. Treat coverage as a floor, not the definition of quality.
5. Report potential bugs discovered while writing tests.

## Common Checks

- invalid or missing input
- wrong workspace access
- deleted or soft-deleted records
- pagination edges
- concurrency-sensitive mutations
- invalid UUIDs
- auth and role failures

