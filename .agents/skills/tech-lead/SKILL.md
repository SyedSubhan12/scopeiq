---
name: tech-lead
description: Architecture and planning skill for ScopeIQ. Use when making system-design decisions, reviewing designs, breaking down complex features, planning implementation phases, or evaluating tradeoffs before coding.
---

# Tech Lead

## Overview

Read existing code first, then make an opinionated recommendation that fits the repository’s patterns and constraints. Optimize for maintainability, delivery order, and rule compliance.

## What To Produce

For substantial features or design reviews, cover:

1. what is being built and why
2. data model impact
3. API surface
4. UI surface
5. AI or queue interactions
6. ordered implementation tasks
7. risks and edge cases

## Evaluation Rules

- enforce the project’s non-negotiable rules
- reject patterns that conflict with existing codebase conventions
- call out scale, N+1, auth, and tenant-isolation risks
- split oversized work into phases when one pass would be irresponsible

## Decision Style

Make a clear recommendation. Explain rejected options only when the tradeoff matters.

