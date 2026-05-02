import type { MiddlewareHandler, Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { randomUUID } from 'node:crypto';
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
  const windowMs = windowSec * 1000;

  return async (c, next) => {
    const rateLimitKey = keyExtractor(c);

    if (rateLimitKey === undefined || rateLimitKey === null || rateLimitKey === '') {
      // Missing workspaceId is a middleware ordering bug, not a client error.
      // Fail closed so AI calls are never unbounded.
      console.error(
        `[AIRateLimiter] workspaceId missing for operation "${operation}". ` +
        'Check middleware ordering — authMiddleware must run before aiRateLimitMiddleware.',
      );
      throw new HTTPException(500, { message: 'Internal configuration error' });
    }

    const key = `ai_rl:${rateLimitKey}:${operation}`;

    try {
      const redis = getRedisConnection();

      const now = Date.now();
      const windowStart = now - windowMs;
      const member = `${now}-${randomUUID()}`;
      const resetAt = now + windowMs;

      const pipe = redis.pipeline();
      pipe.zremrangebyscore(key, 0, windowStart);
      pipe.zadd(key, now, member);
      pipe.zcard(key);
      pipe.expire(key, windowSec);
      const results = await pipe.exec();

      const count = (results as [Error | null, unknown][])[2]?.[1] as number;

      c.header('X-RateLimit-Limit', String(max));
      c.header('X-RateLimit-Remaining', String(Math.max(0, max - count)));
      c.header('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

      if (count > max) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        c.header('Retry-After', String(retryAfter));
        throw new HTTPException(429, { message: 'AI rate limit exceeded. Please try again later.' });
      }
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      // FIND-007: fail closed for AI endpoints. A Redis outage must not turn
      // into unbounded Anthropic spend. Read-only endpoints can fail open;
      // these endpoints cost money per call, so refuse the request instead.
      console.error('[AIRateLimiter] Redis unavailable — failing closed for AI op:', operation);
      throw new HTTPException(503, { message: 'Rate limiter unavailable. Please retry.' });
    }

    await next();
  };
}
