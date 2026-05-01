// npm install @sentry/node  (already in package.json as ^7.102.1)
import * as Sentry from "@sentry/node";

export function initSentry() {
    if (!process.env.SENTRY_DSN) return;

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV ?? "development",
        tracesSampleRate: 0.1,
    });
}

/**
 * Capture an exception in Sentry if Sentry is configured. Safe to call even
 * when SENTRY_DSN is absent — the SDK is a no-op when not initialised.
 */
export function captureException(err: unknown, context?: Record<string, unknown>) {
    Sentry.withScope((scope) => {
        if (context) {
            scope.setExtras(context);
        }
        Sentry.captureException(err);
    });
}
