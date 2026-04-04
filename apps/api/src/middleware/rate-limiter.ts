import { createMiddleware } from "hono/factory";
import { AppError } from "@novabots/types";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * Simple IP-based in-memory rate limiter.
 * @param maxRequests Maximum number of requests allowed per window.
 * @param windowMs Window size in milliseconds.
 */
export function rateLimiter(maxRequests: number, windowMs: number) {
  return createMiddleware(async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    const now = Date.now();
    const key = ip;
    const record = store.get(key);

    if (!record || now > record.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
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
    store.set(key, record);
    return next();
  });
}
