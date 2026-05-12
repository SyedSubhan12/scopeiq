/**
 * Rate-limiter security/reliability tests
 *
 * FIND-002: Portal limiter defaults to 127.0.0.1 in production → 100× bypass
 * FIND-003: In-memory rateLimiter Map grows unbounded
 * FIND-007: AI limiter fails open on missing workspaceId
 * FIND-008: Fixed-window burst at boundary (sliding window migration)
 *
 * Run: pnpm test from apps/api
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Redis mock — must be hoisted before any import that touches ../lib/redis.js
// The mock stores a mutable _now so time-travel tests can fast-forward
// Date.now inside the mock pipeline without patching the global.
// ---------------------------------------------------------------------------

vi.mock('../lib/redis.js', () => {
  // Minimal ioredis-compatible ZSET simulator
  const zsets = new Map<string, Map<string, number>>();

  function reset() {
    zsets.clear();
  }

  function getOrCreate(key: string): Map<string, number> {
    let m = zsets.get(key);
    if (!m) {
      m = new Map<string, number>();
      zsets.set(key, m);
    }
    return m;
  }

  // Pipeline records commands and executes them all synchronously on exec()
  function makePipeline() {
    const ops: Array<() => [null, unknown]> = [];

    return {
      zremrangebyscore(key: string, min: number, max: number) {
        ops.push(() => {
          const m = getOrCreate(key);
          for (const [member, score] of m) {
            if (score >= min && score <= max) m.delete(member);
          }
          return [null, null];
        });
        return this;
      },
      zadd(key: string, score: number, member: string) {
        ops.push(() => {
          getOrCreate(key).set(member, score);
          return [null, 1];
        });
        return this;
      },
      zcard(key: string) {
        ops.push(() => {
          return [null, getOrCreate(key).size];
        });
        return this;
      },
      expire(_key: string, _ttlSec: number) {
        ops.push(() => [null, 1]);
        return this;
      },
      exec() {
        return Promise.resolve(ops.map((op) => op()));
      },
    };
  }

  const mockRedis = {
    pipeline: () => makePipeline(),
  };

  return {
    getRedisConnection: () => mockRedis,
    _mockControl: { reset, zsets },
  };
});

// ---------------------------------------------------------------------------
// Imports after mock registration
// ---------------------------------------------------------------------------

import { portalRateLimiter } from '../middleware/portal-rate-limiter.js';
import { aiRateLimitMiddleware } from '../middleware/ai-rate-limiter.js';
import {
  redisRateLimiter,
  rateLimiter,
  _storeForTesting,
  _maybeSweepStoreForTesting,
} from '../middleware/rate-limiter.js';
import * as redisMod from '../lib/redis.js';

const mockControl = (redisMod as unknown as {
  _mockControl: {
    reset(): void;
    zsets: Map<string, Map<string, number>>;
  };
})._mockControl;

// ---------------------------------------------------------------------------
// Hono context factory helper
// ---------------------------------------------------------------------------

function makeContext(overrides: {
  method?: string;
  headers?: Record<string, string>;
  contextVars?: Record<string, unknown>;
} = {}) {
  const headers: Record<string, string> = overrides.headers ?? {};
  const vars: Record<string, unknown> = overrides.contextVars ?? {};

  const c = {
    req: {
      method: overrides.method ?? 'POST',
      header: (name: string) => headers[name.toLowerCase()] ?? undefined,
    },
    header: vi.fn(),
    get: (key: string) => vars[key],
    set: (key: string, val: unknown) => {
      vars[key] = val;
    },
  };

  return c as unknown as Parameters<typeof portalRateLimiter>[0];
}

async function runMiddleware(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  middleware: (c: any, next: () => Promise<void>) => Promise<void>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  c: any,
): Promise<{ threw: boolean; thrownError: unknown }> {
  let threw = false;
  let thrownError: unknown;
  try {
    await middleware(c, async () => undefined);
  } catch (err) {
    threw = true;
    thrownError = err;
  }
  return { threw, thrownError };
}

// ---------------------------------------------------------------------------
// FIND-008: Sliding-window prevents 2× burst at boundary
// Tests both redisRateLimiter and aiRateLimitMiddleware.
//
// Time-travel strategy: vi.spyOn(Date, 'now') controls what the middleware
// sees when it calls Date.now(). The mock ZSET receives scores equal to the
// spied timestamp, so zremrangebyscore correctly evicts old entries when time
// is advanced past the window.
// ---------------------------------------------------------------------------

describe('FIND-008: sliding-window rate limiter — no fixed-window burst', () => {
  let dateSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    mockControl.reset();
    dateSpy = undefined;
  });
  afterEach(() => {
    dateSpy?.mockRestore();
    mockControl.reset();
  });

  // ---- redisRateLimiter ----

  it('redisRateLimiter: max requests at t=0 are accepted, (max+1)th is rejected', async () => {
    const MAX = 3;
    const WINDOW_MS = 10_000;
    const limiter = redisRateLimiter(MAX, WINDOW_MS, 'test:rl');
    const c = makeContext({ headers: { 'x-forwarded-for': '1.2.3.4' } });

    for (let i = 0; i < MAX; i++) {
      const { threw } = await runMiddleware(limiter, c);
      expect(threw).toBe(false);
    }

    // (MAX+1)th should 429
    const { threw } = await runMiddleware(limiter, c);
    expect(threw).toBe(true);
  });

  it('redisRateLimiter: request at t=windowMs/2 is still rejected (no burst reset mid-window)', async () => {
    const MAX = 3;
    const WINDOW_MS = 10_000;
    const limiter = redisRateLimiter(MAX, WINDOW_MS, 'test:rl2');
    const c = makeContext({ headers: { 'x-forwarded-for': '2.3.4.5' } });
    const startNow = Date.now();

    dateSpy = vi.spyOn(Date, 'now').mockReturnValue(startNow);

    // Fill the window at t=0
    for (let i = 0; i < MAX; i++) {
      await runMiddleware(limiter, c);
    }

    // Advance to mid-window — entries scored at startNow are still within the window
    dateSpy.mockReturnValue(startNow + WINDOW_MS / 2);

    const { threw } = await runMiddleware(limiter, c);
    expect(threw).toBe(true);
  });

  it('redisRateLimiter: request at t=windowMs+100 is accepted (old entries expired)', async () => {
    const MAX = 3;
    const WINDOW_MS = 10_000;
    const limiter = redisRateLimiter(MAX, WINDOW_MS, 'test:rl3');
    const c = makeContext({ headers: { 'x-forwarded-for': '3.4.5.6' } });
    const startNow = Date.now();

    dateSpy = vi.spyOn(Date, 'now').mockReturnValue(startNow);

    // Fill the window at t=startNow
    for (let i = 0; i < MAX; i++) {
      await runMiddleware(limiter, c);
    }

    // Advance past the window — entries scored at startNow fall outside
    // [now - windowMs, now] = [startNow+100, startNow+windowMs+100]
    dateSpy.mockReturnValue(startNow + WINDOW_MS + 100);

    const { threw } = await runMiddleware(limiter, c);
    expect(threw).toBe(false);
  });

  // ---- aiRateLimitMiddleware ----

  it('aiRateLimitMiddleware: max requests at t=0 accepted, (max+1)th rejected', async () => {
    const limiter = aiRateLimitMiddleware('generate_change_order'); // max=20
    const MAX = 20;

    for (let i = 0; i < MAX; i++) {
      const c = makeContext({ contextVars: { workspaceId: 'ws-test-burst' } });
      const { threw } = await runMiddleware(limiter, c);
      expect(threw).toBe(false);
    }

    const c = makeContext({ contextVars: { workspaceId: 'ws-test-burst' } });
    const { threw } = await runMiddleware(limiter, c);
    expect(threw).toBe(true);
  });

  it('aiRateLimitMiddleware: request at t=windowMs+100 is accepted', async () => {
    const WINDOW_MS = 3600 * 1000;
    const MAX = 20;
    const startNow = Date.now();

    dateSpy = vi.spyOn(Date, 'now').mockReturnValue(startNow);

    const limiter = aiRateLimitMiddleware('generate_change_order');

    // Fill at t=startNow
    for (let i = 0; i < MAX; i++) {
      const c = makeContext({ contextVars: { workspaceId: 'ws-test-slide' } });
      await runMiddleware(limiter, c);
    }

    // Advance past the window
    dateSpy.mockReturnValue(startNow + WINDOW_MS + 100);

    const c = makeContext({ contextVars: { workspaceId: 'ws-test-slide' } });
    const { threw } = await runMiddleware(limiter, c);
    expect(threw).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FIND-002: Portal limiter — production falls back to token bucket, not localhost
// ---------------------------------------------------------------------------

describe('FIND-002: portal rate limiter — no localhost fallback in production', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockControl.reset();
  });
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    mockControl.reset();
  });

  it('production with no IP headers applies strict 10/hr limit, not 1000/hr dev limit', async () => {
    process.env.NODE_ENV = 'production';

    const STRICT_MAX = 10;
    const token = 'portal-token-abc123';

    // Send STRICT_MAX requests — all should pass
    for (let i = 0; i < STRICT_MAX; i++) {
      const c = makeContext({ headers: { 'x-portal-token': token } });
      const { threw } = await runMiddleware(portalRateLimiter, c);
      expect(threw).toBe(false);
    }

    // The (STRICT_MAX+1)th request must be blocked
    const c = makeContext({ headers: { 'x-portal-token': token } });
    const { threw } = await runMiddleware(portalRateLimiter, c);
    expect(threw).toBe(true);
  });

  it('production with no IP and no token still applies strict limit (unknown bucket)', async () => {
    process.env.NODE_ENV = 'production';

    const STRICT_MAX = 10;

    for (let i = 0; i < STRICT_MAX; i++) {
      const c = makeContext({}); // no IP headers, no token
      const { threw } = await runMiddleware(portalRateLimiter, c);
      expect(threw).toBe(false);
    }

    const c = makeContext({});
    const { threw } = await runMiddleware(portalRateLimiter, c);
    expect(threw).toBe(true);
  });

  it('development with no IP headers uses 1000/hr limit (dev allowance)', async () => {
    process.env.NODE_ENV = 'development';

    // 11 requests should all succeed in dev (limit is 1000)
    for (let i = 0; i < 11; i++) {
      const c = makeContext({});
      const { threw } = await runMiddleware(portalRateLimiter, c);
      expect(threw).toBe(false);
    }
  });

  it('production with a real IP uses IP-based limit, not token-based fallback', async () => {
    process.env.NODE_ENV = 'production';

    const STRICT_MAX = 10;

    for (let i = 0; i < STRICT_MAX; i++) {
      const c = makeContext({ headers: { 'x-forwarded-for': '203.0.113.42' } });
      const { threw } = await runMiddleware(portalRateLimiter, c);
      expect(threw).toBe(false);
    }

    const c = makeContext({ headers: { 'x-forwarded-for': '203.0.113.42' } });
    const { threw } = await runMiddleware(portalRateLimiter, c);
    expect(threw).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// FIND-007: AI limiter fails closed (500) on missing workspaceId
// ---------------------------------------------------------------------------

describe('FIND-007: AI rate limiter — fails closed on missing workspaceId', () => {
  beforeEach(() => {
    mockControl.reset();
  });

  it('throws HTTPException 500 when workspaceId is undefined', async () => {
    const limiter = aiRateLimitMiddleware('score_brief');
    const c = makeContext({ contextVars: {} }); // workspaceId not set

    const { threw, thrownError } = await runMiddleware(limiter, c);
    expect(threw).toBe(true);

    const err = thrownError as { status?: number };
    expect(err.status).toBe(500);
  });

  it('throws HTTPException 500 when workspaceId is empty string', async () => {
    const limiter = aiRateLimitMiddleware('check_scope');
    const c = makeContext({ contextVars: { workspaceId: '' } });

    const { threw, thrownError } = await runMiddleware(limiter, c);
    expect(threw).toBe(true);

    const err = thrownError as { status?: number };
    expect(err.status).toBe(500);
  });

  it('does NOT throw 500 when workspaceId is a valid string', async () => {
    const limiter = aiRateLimitMiddleware('score_brief');
    const c = makeContext({ contextVars: { workspaceId: 'ws-valid-001' } });

    const { threw, thrownError } = await runMiddleware(limiter, c);

    // May throw 429 if over limit, but never 500
    if (threw) {
      const err = thrownError as { status?: number };
      expect(err.status).not.toBe(500);
    }
  });

  it('custom keyExtractor returning undefined also triggers 500', async () => {
    const limiter = aiRateLimitMiddleware('generate_change_order', () => undefined);
    const c = makeContext({ contextVars: { workspaceId: 'ws-irrelevant' } });

    const { threw, thrownError } = await runMiddleware(limiter, c);
    expect(threw).toBe(true);

    const err = thrownError as { status?: number };
    expect(err.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// FIND-003: In-memory rateLimiter map does not grow unbounded
//
// We directly populate _storeForTesting and call the exported
// _maybeSweepStoreForTesting rather than running 100k async middleware
// invocations (which would time out). This tests the eviction logic itself.
// ---------------------------------------------------------------------------

describe('FIND-003: in-memory rateLimiter — bounded map size', () => {
  afterEach(() => {
    _storeForTesting.clear();
  });

  it('store does not exceed ~55k entries: eviction runs when fed 100k unique IPs', () => {
    // Use a far-future resetAt so none are expired — this forces the
    // "still above cap, evict oldest 10%" path.
    const futureResetAt = Date.now() + 60 * 60 * 1000;

    // Fill to 100k entries directly (no async overhead)
    for (let i = 0; i < 100_000; i++) {
      const ip = `10.${(i >> 16) & 0xff}.${(i >> 8) & 0xff}.${i & 0xff}`;
      _storeForTesting.set(ip, { count: 1, resetAt: futureResetAt });

      // Simulate what rateLimiter does: sweep when inserting a new entry
      // that would push us past the cap.
      if (_storeForTesting.size > 50_000) {
        _maybeSweepStoreForTesting(50_000);
      }
    }

    // After processing 100k unique IPs with eviction at 50k cap, the store
    // should never exceed cap + 10% (one batch of new inserts before next sweep).
    expect(_storeForTesting.size).toBeLessThanOrEqual(55_000);
  });

  it('after eviction a new IP gets a fresh record (no corrupt state)', () => {
    // Fill to just past the cap
    const futureResetAt = Date.now() + 60 * 60 * 1000;
    for (let i = 0; i < 50_001; i++) {
      const ip = `192.168.${(i >> 8) & 0xff}.${i & 0xff}`;
      _storeForTesting.set(ip, { count: 1, resetAt: futureResetAt });
    }

    // Trigger eviction
    _maybeSweepStoreForTesting(50_000);

    // Store is now under cap
    expect(_storeForTesting.size).toBeLessThanOrEqual(50_000);

    // A fresh IP should be accepted without error
    const knownIp = '10.99.99.99';
    _storeForTesting.set(knownIp, { count: 1, resetAt: futureResetAt });
    const record = _storeForTesting.get(knownIp);
    expect(record).toBeDefined();
    expect(record?.count).toBe(1);
  });

  it('expired entries are swept first before evicting non-expired ones', () => {
    const now = Date.now();
    const expired = now - 1; // already past
    const future = now + 60_000;

    // Insert 25k expired + 30k non-expired = 55k > cap of 50k
    for (let i = 0; i < 25_000; i++) {
      _storeForTesting.set(`expired:${i}`, { count: 1, resetAt: expired });
    }
    for (let i = 0; i < 30_000; i++) {
      _storeForTesting.set(`active:${i}`, { count: 1, resetAt: future });
    }

    expect(_storeForTesting.size).toBe(55_000);
    _maybeSweepStoreForTesting(50_000);

    // All expired entries removed; active entries remain
    expect(_storeForTesting.size).toBe(30_000);
    expect(_storeForTesting.has('expired:0')).toBe(false);
    expect(_storeForTesting.has('active:0')).toBe(true);
  });
});
