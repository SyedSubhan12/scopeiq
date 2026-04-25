import type { MiddlewareHandler } from 'hono';
import { randomBytes } from 'crypto';

declare module 'hono' {
  interface ContextVariableMap {
    cspNonce: string;
  }
}

export function securityHeadersMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const nonce = randomBytes(16).toString('base64');
    c.set('cspNonce', nonce);
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    c.header('Content-Security-Policy', [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://files.scopeiq.com data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src https://www.figma.com https://loom.com https://www.youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '));
  };
}
