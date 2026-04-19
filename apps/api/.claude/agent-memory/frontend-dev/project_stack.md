---
name: Project Stack
description: Core tech stack, key constraints, and TypeScript gotchas for this codebase
type: project
---

Next.js 14 App Router, React 18, TypeScript strict mode with `exactOptionalPropertyTypes: true` in tsconfig.

**Why:** exactOptionalPropertyTypes means you cannot pass `prop={value || undefined}` — you must conditionally spread: `{...(value ? { prop: value } : {})}`.

**How to apply:** Whenever passing an optional prop that could be undefined, use conditional spread instead of `prop={x || undefined}`.

GSAP dynamic imports: many files use `import("gsap/dist/gsap")` which produces TS2307 errors in the pre-existing codebase (missing type declarations). This is a known pre-existing issue — do not attempt to fix it. Use `// @ts-expect-error` before dynamic GSAP imports per the task instructions.

`@novabots/ui` exports: Button, Input, Textarea, Select, Badge, Card, MetricCard, Dialog, DropdownMenu, Avatar, Skeleton, Toast/useToast, cn, Tabs.

dnd-kit packages installed: `@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`, `@dnd-kit/utilities ^3.2.2`.
