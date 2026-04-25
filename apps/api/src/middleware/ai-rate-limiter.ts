import type { MiddlewareHandler, Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getRedisConnection } from '../lib/redis.js';

export const AI_RATE_LIMITS = {
  score_brief: { window: 3600, max: 50 },
  check_scope: { window: 3600, max: 200 },
  generate_change_order: { window: 3600, max: 20 },
} as const;

type KeyExtractor = (c: Context) => string | undefined;

function defaultKeyExtractor(c: Context): string | undefined {
  return c.get('workspaceId') as string | undefined;
}

export function aiRateLimitMiddleware(
  operation: keyof typeof AI_RATE_LIMITS,
  keyExtractor: KeyExtractor = defaultKeyExtractor,
): MiddlewareHandler {
  const { window: windowSec, max } = AI_RATE_LIMITS[operation];

  return async (c, next) => {
    const rateLimitKey = keyExtractor(c);
    if (!rateLimitKey) {
      await next();
      return;
    }

    const windowBucket = Math.floor(Date.now() / (windowSec * 1000));
    const key = `ai_rl:${rateLimitKey}:${operation}:${windowBucket}`;

    try {
      const redis = getRedisConnection();
      const pipe = redis.pipeline();
      pipe.incr(key);
      pipe.expire(key, windowSec);
      const results = await pipe.exec();

      const count = (results as [Error | null, unknown][])[0]?.[1] as number;

      c.header('X-RateLimit-Limit', String(max));
      c.header('X-RateLimit-Remaining', String(Math.max(0, max - count)));
      c.header('X-RateLimit-Reset', String((windowBucket + 1) * windowSec));

      if (count > max) {
        const retryAfter = (windowBucket + 1) * windowSec - Math.floor(Date.now() / 1000);
        c.header('Retry-After', String(retryAfter));
        throw new HTTPException(429, { message: 'AI rate limit exceeded. Please try again later.' });
      }
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.warn('[AIRateLimiter] Redis unavailable, skipping rate check');
    }

    await next();
  };
}
