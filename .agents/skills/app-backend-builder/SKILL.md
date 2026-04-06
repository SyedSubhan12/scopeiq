---
name: app-backend-builder
description: Backend app-building skill. Use when implementing APIs, services, authentication, authorization, jobs, integrations, validation, or business logic that powers app features.
---

# App Backend Builder

## Overview

Build backend behavior around stable contracts, invariant enforcement, and operational safety. The API should make frontend work simpler, not leak backend complexity into the client.

## Core Rules

1. Validate inputs at the boundary.
2. Keep business logic in services, not transport handlers.
3. Define explicit error semantics and status codes.
4. Enforce authorization and tenant or account boundaries consistently.
5. Make side effects idempotent when retries are plausible.

## Delivery Pattern

1. define contract
2. implement validation
3. implement service logic
4. integrate persistence and side effects
5. add tests for contracts and failure cases

