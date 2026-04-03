# PHASE 0 — Project Scaffolding & Infrastructure
## Cursor Agent Prompt | ScopeIQ by Novabots
### Estimated Duration: 2-3 days | Priority: BLOCKING (nothing else can start)

---

## CONTEXT

You are building ScopeIQ, a B2B SaaS platform for creative agencies. This is Phase 0: setting up the Turborepo monorepo, all configuration files, Docker infrastructure, and the foundational package structure. No business logic yet — just the skeleton that all other phases build on.

## GOAL

After this phase, running `pnpm dev` should start three empty but functional services:
- `apps/web` at http://localhost:3000 (Next.js 14 — shows "ScopeIQ" placeholder page)
- `apps/api` at http://localhost:4000 (Hono — returns `{ "status": "ok" }` at GET `/health`)
- `apps/ai` at http://localhost:8000 (FastAPI — returns `{ "status": "ok" }` at GET `/health`)

Docker should start PostgreSQL, Redis, and MinIO (S3-compatible).

---

## FILES TO CREATE (in order)

### Root Configuration

```
1.  package.json              — pnpm workspace root, scripts: dev, build, test, lint, typecheck
2.  pnpm-workspace.yaml       — defines apps/* and packages/* workspaces
3.  turbo.json                 — pipeline: build, dev, test, lint, typecheck with dependencies
4.  .gitignore                 — node_modules, .env*, dist, .next, .turbo, __pycache__
5.  .env.example               — ALL environment variables documented (see Master Prompt 6.2)
6.  docker-compose.yml         — PostgreSQL 15 (port 5432), Redis 7 (port 6379), MinIO (port 9000)
7.  .prettierrc                — printWidth: 100, singleQuote: true, trailingComma: "all", semi: true
8.  .eslintrc.js               — extends next/core-web-vitals + prettier
```

### packages/config/

```
9.  packages/config/package.json
10. packages/config/tsconfig.base.json    — strict: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true, paths aliases
11. packages/config/tsconfig.nextjs.json  — extends base, adds JSX preserve, Next.js plugin
12. packages/config/tsconfig.node.json    — extends base, module: NodeNext, target: ES2022
13. packages/config/eslint-preset.js      — shared ESLint config
```

### packages/types/

```
14. packages/types/package.json
15. packages/types/src/index.ts           — export all types
16. packages/types/src/errors.ts          — AppError class, NotFoundError, ValidationError, UnauthorizedError, ForbiddenError
17. packages/types/src/api.ts             — ApiResponse<T>, ApiError, PaginatedResponse<T>, CursorPagination types
18. packages/types/tsconfig.json
```

### packages/db/

```
19. packages/db/package.json              — drizzle-orm, drizzle-kit, pg dependencies
20. packages/db/tsconfig.json
21. packages/db/drizzle.config.ts         — schema path, migrations path, PostgreSQL connection
22. packages/db/src/index.ts              — export db instance, schema, helpers
23. packages/db/src/client.ts             — Drizzle client initialization with connection pool
24. packages/db/schema/index.ts           — barrel export for all schema files (empty for now)
```

### packages/ui/

```
25. packages/ui/package.json              — react, radix-ui, tailwind, lucide-react dependencies
26. packages/ui/tsconfig.json
27. packages/ui/src/index.ts              — barrel export
28. packages/ui/tailwind.config.ts        — ScopeIQ design tokens as CSS variables (see Design UX Spec)
29. packages/ui/globals.css               — Tailwind directives + CSS variable definitions for all color tokens
```

### apps/web/

```
30. apps/web/package.json                 — next, react, react-dom, tailwind, zustand, @tanstack/react-query, framer-motion, react-hook-form, zod, @hookform/resolvers
31. apps/web/tsconfig.json                — extends nextjs config, path aliases: @/ -> src/
32. apps/web/next.config.js               — transpilePackages: [@novabots/ui, @novabots/db, @novabots/types]
33. apps/web/tailwind.config.ts           — extends packages/ui/tailwind.config, content paths
34. apps/web/postcss.config.js
35. apps/web/src/app/layout.tsx           — Root layout with Inter font, React Query provider, metadata
36. apps/web/src/app/page.tsx             — Placeholder landing: "ScopeIQ — Coming Soon"
37. apps/web/src/app/globals.css          — Import packages/ui/globals.css + Tailwind
38. apps/web/src/lib/api.ts               — API client helper: baseUrl, fetchWithAuth wrapper, error handling
39. apps/web/src/lib/query-client.ts      — React Query client configuration (staleTime, retry)
40. apps/web/src/providers/index.tsx       — QueryClientProvider + any future providers
```

### apps/api/

```
41. apps/api/package.json                 — hono, @hono/node-server, @hono/zod-validator, zod, drizzle-orm, bullmq, stripe, @supabase/supabase-js, resend, @sentry/node
42. apps/api/tsconfig.json                — extends node config
43. apps/api/src/index.ts                 — Hono app creation, mount routes, start server on port 4000
44. apps/api/src/routes/health.route.ts   — GET /health returns { status: "ok", timestamp, version }
45. apps/api/src/middleware/error.ts       — Global error handler: catches all errors, formats ApiError response, logs to console (Sentry later)
46. apps/api/src/middleware/cors.ts        — CORS middleware: allow localhost:3000 in dev, scopeiq.com in prod
47. apps/api/src/middleware/logger.ts      — Request logging middleware: method, path, status, duration
48. apps/api/src/lib/env.ts               — Zod schema for ALL env vars, parse on startup, crash if missing
```

### apps/ai/

```
49. apps/ai/requirements.txt              — fastapi, uvicorn, anthropic, bullmq, pydantic, pymupdf, structlog, httpx, pytest, pytest-asyncio
50. apps/ai/app/__init__.py
51. apps/ai/app/main.py                   — FastAPI app, health endpoint, CORS, startup/shutdown events
52. apps/ai/app/config.py                 — Pydantic Settings for env vars (ANTHROPIC_API_KEY, REDIS_URL, DATABASE_URL)
53. apps/ai/Dockerfile                    — Python 3.12 slim, install deps, run uvicorn
```

---

## CRITICAL SPECIFICATIONS

### docker-compose.yml

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: scopeiq
      POSTGRES_PASSWORD: scopeiq_dev
      POSTGRES_DB: scopeiq
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U scopeiq"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: scopeiq
      MINIO_ROOT_PASSWORD: scopeiq_dev
    command: server /data --console-address ":9001"
    volumes: [miniodata:/data]

volumes:
  pgdata:
  miniodata:
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env.local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

### CSS Variables (packages/ui/globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --primary: 15 110 86;          /* #0F6E56 */
    --primary-mid: 29 158 117;     /* #1D9E75 */
    --primary-light: 225 245 238;  /* #E1F5EE */
    --primary-dark: 10 88 67;      /* #0A5843 */
    --status-red: 220 38 38;       /* #DC2626 */
    --status-amber: 217 119 6;     /* #D97706 */
    --status-green: 5 150 105;     /* #059669 */
    --status-blue: 37 99 235;      /* #2563EB */
    --text-primary: 13 27 42;      /* #0D1B2A */
    --text-secondary: 75 85 99;    /* #4B5563 */
    --text-muted: 156 163 175;     /* #9CA3AF */
    --surface-subtle: 248 250 252; /* #F8FAFC */
    --border-default: 209 213 219; /* #D1D5DB */
    --border-subtle: 229 231 235;  /* #E5E7EB */
  }
}
```

### Tailwind Config (packages/ui/tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          mid: "rgb(var(--primary-mid) / <alpha-value>)",
          light: "rgb(var(--primary-light) / <alpha-value>)",
          dark: "rgb(var(--primary-dark) / <alpha-value>)",
        },
        status: {
          red: "rgb(var(--status-red) / <alpha-value>)",
          amber: "rgb(var(--status-amber) / <alpha-value>)",
          green: "rgb(var(--status-green) / <alpha-value>)",
          blue: "rgb(var(--status-blue) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
```

### Error Classes (packages/types/src/errors.ts)

```typescript
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super("NOT_FOUND", `${entity} with id ${id} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super("FORBIDDEN", message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
  }
}
```

### API Response Types (packages/types/src/api.ts)

```typescript
export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CursorPagination {
  next_cursor: string | null;
  has_more: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: CursorPagination;
}
```

---

## VERIFICATION

After completing this phase:

```bash
# Start infrastructure
docker-compose up -d

# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Start all services
pnpm dev

# Verify endpoints
curl http://localhost:3000        # → Next.js page renders
curl http://localhost:4000/health # → { "status": "ok" }
curl http://localhost:8000/health # → { "status": "ok" }
```

## COMMIT

```
feat(scaffold): initialize Turborepo monorepo with all services and packages
```
