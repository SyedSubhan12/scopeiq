---
name: app-data-modeler
description: Data-modeling skill for app development. Use when designing entities, relationships, constraints, indexes, migrations, derived fields, event shapes, or storage decisions for application features.
---

# App Data Modeler

## Overview

Shape persistence around invariants and query needs, not around whichever object shape is convenient in one UI component.

## Core Rules

1. Model entities around ownership and lifecycle.
2. Capture invariants as constraints when possible.
3. Design for the main read patterns as well as writes.
4. Avoid denormalization until a real access pattern justifies it.
5. Plan migrations and backfills before changing live schemas.

## Deliverables

- entity list
- relationships
- constraints and indexes
- migration notes
- risky query patterns
- future-proofing notes only when they affect today’s design

