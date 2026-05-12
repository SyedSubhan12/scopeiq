import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createHash, randomUUID } from "node:crypto";
import { getRedisConnection } from "../lib/redis.js";

// Rate limits: 1000 req/hour for localhost (dev/test), 10 req/hour for others (prod)
const getPortalRateLimit = (ip: string) => {
  if (ip === "127.0.0.1" || ip === "localhost" || ip === "::1") {
    return { max: 1000, windowMs: 60 * 60 * 1000 }; // 1000 req/hour for localhost
  }
  return { max: 10, windowMs: 60 * 60 * 1000 }; // 10 req/hour for others
};

const STRICT_LIMIT = { max: 10, windowMs: 60 * 60 * 1000 } as const;

interface RedisRateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

async function checkRedisRateLimit(bucketKey: string, max: number, windowMs: number): Promise<RedisRateLimitResult> {
  const redis = getRedisConnection();
  const key = `ratelimit:portal:${bucketKey}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  const member = `${now}-${randomUUID()}`;

  const pipe = redis.pipeline();
  pipe.zremrangebyscore(key, 0, windowStart);
  pipe.zadd(key, now, member);
  pipe.zcard(key);
  pipe.expire(key, Math.ceil(windowMs / 1000));
  const results = await pipe.exec();

  const count = (results as [Error | null, unknown][])[2]?.[1] as number;
  const remaining = Math.max(0, max - count);
  const reset = now + windowMs;

  return {
    success: count <= max,
    remaining,
    reset,
  };
}

/**
 * Derive a stable, non-reversible bucket key from a portal token.
 * Uses the first 16 hex characters (8 bytes) of the SHA-256 digest — enough
 * entropy to be unique per token without leaking the secret material.
 */
function tokenBucketKey(token: string): string {
  const digest = createHash("sha256").update(token).digest("hex");
  return `token:${digest.slice(0, 16)}`;
}

/**
 * Rate limiter for public portal endpoints.
 * Uses Redis sliding window ZSET counter.
 *
 * IP resolution:
 *   - In development/test: falls back to 127.0.0.1 when no IP header present,
 *     which receives the 1000 req/hr dev limit.
 *   - In production (any other NODE_ENV): when no IP header is present, derives
 *     a stable bucket key from the X-Portal-Token header (first 16 hex chars of
 *     SHA-256). Applies the strict 10 req/hr limit. This prevents the 127.0.0.1
 *     fallback from granting the 1000 req/hr dev limit in production.
 */
export const portalRateLimiter = createMiddleware(async (c, next) => {
  const cfIp = c.req.header("cf-connecting-ip");
  const xffIp = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  const resolvedIp = cfIp ?? xffIp;

  const isDev =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

  let bucketKey: string;
  let max: number;
  let windowMs: number;

  if (resolvedIp !== undefined) {
    // We have a real client IP — apply the normal IP-based limit
    const limits = getPortalRateLimit(resolvedIp);
    bucketKey = resolvedIp;
    max = limits.max;
    windowMs = limits.windowMs;
  } else if (isDev) {
    // Dev / test: safe to fall back to localhost bucket
    const limits = getPortalRateLimit("127.0.0.1");
    bucketKey = "127.0.0.1";
    max = limits.max;
    windowMs = limits.windowMs;
  } else {
    // Production with no identifiable IP: derive bucket from portal token.
    // Apply the strict limit — this is the worst-case fallback.
    const token = c.req.header("x-portal-token");
    bucketKey = token !== undefined ? tokenBucketKey(token) : "token:unknown";
    max = STRICT_LIMIT.max;
    windowMs = STRICT_LIMIT.windowMs;
  }

  try {
    const result = await checkRedisRateLimit(bucketKey, max, windowMs);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(result.reset / 1000)));

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      c.header("Retry-After", String(retryAfter));
      throw new HTTPException(429, { message: "Too many requests. Please try again later." });
    }
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    // Redis unavailable — fail open with warning
    console.warn("[RateLimiter] Redis rate limiter unavailable, skipping rate check");
  }

  await next();
});
