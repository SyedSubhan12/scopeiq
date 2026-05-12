---
name: Rate limiter patterns and security fixes
description: Sliding-window ZSET pattern, in-memory eviction cap, portal IP fallback logic, AI limiter fail-closed behavior
type: feedback
---

Use `zremrangebyscore / zadd / zcard / expire` ZSET pipeline (not `incr`) for all Redis-backed rate limiters. The portal limiter already used this pattern; `redisRateLimiter` and `aiRateLimitMiddleware` were migrated to match (FIND-008). Member uniqueness uses `crypto.randomUUID()`, not `Math.random()`.

**Why:** Fixed-window (`Math.floor(Date.now() / windowMs)`) allows 2× burst at window seams. ZSET sliding window does not.

For `X-RateLimit-Reset` use `now + windowMs` (epoch ms, then `Math.ceil(/ 1000)`), not `(bucket + 1) * windowSec`.

In-memory `rateLimiter` Map has a 50_000 cap. Before inserting a new key, call `maybeSweepStore(50_000)`. Sweep logic: first evict expired entries; if still over cap, evict oldest 10% by `resetAt`. No `setInterval` — sweep is triggered on insert only (FIND-003).

**Why:** Without a cap the Map grows linearly with unique IPs and leaks memory in long-lived processes.

Portal limiter IP resolution: `cf-connecting-ip` → `x-forwarded-for` → production fallback. In `development`/`test` the fallback is `127.0.0.1` (1000/hr dev limit). In any other `NODE_ENV`, compute `tokenBucketKey` from `X-Portal-Token` (first 16 hex chars of SHA-256 prefixed `token:`), apply strict 10/hr. Never apply localhost limit in production (FIND-002).

**How to apply:** Any time IP can be absent from a portal request in production, always fall through to the token-bucket path, not to a localhost IP.

AI limiter: if `rateLimitKey` is `undefined`, `null`, or `''`, throw `HTTPException(500, { message: 'Internal configuration error' })` and `console.error` (not warn) with the operation name. Do NOT call `next()`. This is a configuration bug (authMiddleware not run first), not a client error — fail closed (FIND-007).

**How to apply:** Every new `aiRateLimitMiddleware` call site: verify `authMiddleware` runs first in the route stack.

Test strategy for sliding-window time-travel: `vi.spyOn(Date, 'now').mockReturnValue(ts)` before filling the window, then `mockReturnValue(ts + windowMs + 100)` to advance time. The mock Redis ZSET stores scores from the spied `Date.now()`, so `zremrangebyscore` correctly evicts old entries. Always `mockRestore()` in `afterEach`.

Test strategy for in-memory cap: populate `_storeForTesting` directly (exported for tests) and call exported `_maybeSweepStoreForTesting(cap)` — do not run 100k async middleware invocations (too slow, will timeout at default 5s).
