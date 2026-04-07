import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getRedisConnection } from "../lib/redis.js";

const PORTAL_RATE_LIMIT_MAX = 10;
const PORTAL_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface RedisRateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

async function checkRedisRateLimit(ip: string, max: number, windowMs: number): Promise<RedisRateLimitResult> {
  const redis = getRedisConnection();
  const key = `ratelimit:portal:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const pipe = redis.pipeline();
  pipe.zremrangebyscore(key, 0, windowStart);
  pipe.zadd(key, now, `${now}-${Math.random()}`);
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
 * Rate limiter for public portal endpoints.
 * Uses Redis if available, falls back to in-memory store.
 * 10 requests per hour per IP (enforced at Cloudflare edge + Redis counter).
 */
export const portalRateLimiter = createMiddleware(async (c, next) => {
  const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    const result = await checkRedisRateLimit(ip, PORTAL_RATE_LIMIT_MAX, PORTAL_RATE_LIMIT_WINDOW_MS);

    c.header("X-RateLimit-Limit", String(PORTAL_RATE_LIMIT_MAX));
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
