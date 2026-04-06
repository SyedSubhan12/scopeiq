---
name: frontend-dev
description: Frontend implementation skill for ScopeIQ UI work. Use when building React components, Next.js pages, forms, React Query hooks, Zustand UI state, layouts, or other client-side features in this repository.
---

# Frontend Dev

## Overview

Build UI that matches the project’s component, token, and data-fetching conventions. Default to server components and introduce client boundaries only when interaction requires them.

## Stack

- Next.js 14 App Router
- TypeScript strict mode
- `@novabots/ui`
- Tailwind with token-based CSS variables
- React Query v5
- Zustand for local UI state
- React Hook Form with Zod
- Framer Motion

## Core Rules

1. Use server components by default.
2. Use `@novabots/ui` primitives instead of raw form and button elements where applicable.
3. Use design tokens instead of hardcoded colors.
4. Route API calls through `fetchWithAuth()`.
5. Invalidate React Query caches after mutations.
6. Add loading and empty states for list or fetch-driven screens.

## Delivery Pattern

1. Read existing route, page, and hook patterns first.
2. Split server shell and client interactivity when useful.
3. Keep form validation close to the component with Zod.
4. Reuse shared components and hooks before inventing new primitives.
5. Verify responsive behavior and keyboard access.

