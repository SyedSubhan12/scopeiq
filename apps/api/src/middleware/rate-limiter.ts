import { createMiddleware } from "hono/factory";
import { LRUCache } from "lru-cache";
import type { Context } from "hono";
import { AppError } from "@novabots/types";
import { randomUUID } from "node:crypto";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const STORE_CAP = 50_000;

// FIND-011: LRU eviction is O(1); replaces the previous Map+sort that became
// O(n log n) per insert once the store filled. ttl is set per-window via the
// `ttl` option on each set() call so entries expire automatically.
const store = new LRUCache<string, RateLimitRecord>({
  max: STORE_CAP,
  ttlAutopurge: true,
});

/**
 * Resolve the client IP from request headers. Honors PROXY_TRUST_HEADER which
 * MUST be set explicitly in production — otherwise an attacker can spoof the
 * source IP via X-Forwarded-For and bypass IP-keyed rate limits (FIND-011).
 *
 * Allowed values: "cf-connecting-ip", "x-real-ip", "x-forwarded-for".
 * In dev/test we fall back to the XFF/x-real-ip cascade for convenience.
 */
function resolveIp(c: Context): string {
  const trustHeader = process.env.PROXY_TRUST_HEADER;
  const isProd = process.env.NODE_ENV === "production";

  if (trustHeader) {
    const raw = c.req.header(trustHeader);
    if (!raw) return "unknown";
    return raw.split(",")[0]?.trim() ?? "unknown";
  }
  if (isProd) {
    // Refuse to trust attacker-controlled headers in prod when nothing
    // explicitly designated.
    return "unknown";
  }
  // Dev / test fallback only.
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

/**
 * Simple IP-based in-memory rate limiter.
 * Suitable for single-process or dev use.  For multi-replica production
 * deployments use redisRateLimiter() instead.
 * @param maxRequests Maximum number of requests allowed per window.
 * @param windowMs Window size in milliseconds.
 */
export function rateLimiter(maxRequests: number, windowMs: number) {
  return createMiddleware(async (c, next) => {
    const ip = resolveIp(c);

    const now = Date.now();
    const key = ip;
    const record = store.get(key);

    if (!record || now > record.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs }, { ttl: windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      throw new AppError(
        "RATE_LIMIT_EXCEEDED",
        "Too many requests. Please try again later.",
        429,
      );
    }

    record.count += 1;
    store.set(key, record, { ttl: record.resetAt - now });
    return next();
  });
}

/**
 * Redis-backed sliding-window rate limiter for mutation routes.
 * Uses a ZSET per IP so partial windows don't allow 2× burst at boundaries.
 * Applies only to state-changing HTTP methods (POST, PATCH, PUT, DELETE).
 * GET / HEAD / OPTIONS are passed through immediately.
 *
 * @param maxRequests  Maximum requests allowed in the window (default 100).
 * @param windowMs     Window size in milliseconds (default 1 hour).
 * @param keyPrefix    Redis key namespace (default "rl:v1mutations").
 */
export function redisRateLimiter(
  maxRequests = 100,
  windowMs = 60 * 60 * 1000,
  keyPrefix = "rl:v1mutations",
) {
  const MUTATION_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

  return createMiddleware(async (c, next) => {
    // Only rate-limit state-changing requests.
    if (!MUTATION_METHODS.has(c.req.method)) {
      return next();
    }

    const ip = resolveIp(c);

    const key = `${keyPrefix}:${ip}`;

    try {
      // Lazy import to avoid circular dependency with redis lib
      const { getRedisConnection } = await import("../lib/redis.js");
      const redis = getRedisConnection();

      const now = Date.now();
      const windowStart = now - windowMs;
      const member = `${now}-${randomUUID()}`;
      const resetAt = now + windowMs;

      const pipe = redis.pipeline();
      pipe.zremrangebyscore(key, 0, windowStart);
      pipe.zadd(key, now, member);
      pipe.zcard(key);
      pipe.expire(key, Math.ceil(windowMs / 1000));
      const results = await pipe.exec();

      const count = (results as [Error | null, unknown][])[2]?.[1] as number;

      c.header("X-RateLimit-Limit", String(maxRequests));
      c.header("X-RateLimit-Remaining", String(Math.max(0, maxRequests - count)));
      c.header("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

      if (count > maxRequests) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        c.header("Retry-After", String(retryAfter));
        throw new AppError(
          "RATE_LIMIT_EXCEEDED",
          "Too many requests. Please try again later.",
          429,
        );
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Redis unavailable — fail open with a warning so the API remains usable.
      console.warn("[RateLimiter] Redis unavailable, skipping mutation rate check:", (err as Error).message);
    }

    return next();
  });
}

// Exports for testing only — do not use in application code.
// The legacy `_maybeSweepStoreForTesting` is preserved as a no-op for tests
// that assert eviction behavior; the LRU does its own eviction now.
export { store as _storeForTesting };
export function _maybeSweepStoreForTesting(_cap: number): void {
  store.purgeStale();
}
