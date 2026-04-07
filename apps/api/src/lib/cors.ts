import { cors } from "hono/cors";
import { env } from "./env.js";

/**
 * Production-ready CORS configuration.
 *
 * Allowed origins are determined by:
 * 1. ALLOWED_ORIGINS env var (comma-separated list)
 * 2. WEB_URL env var (the deployed frontend URL)
 * 3. APP_URL env var (fallback)
 * 4. In development: localhost:3000 is always allowed
 *
 * Usage: app.use("*", corsConfig);
 */
const allowedOrigins = (() => {
    const origins = new Set<string>();

    // Always allow localhost in development
    if (env.NODE_ENV === "development") {
        origins.add("http://localhost:3000");
        origins.add("http://localhost:4000");
        origins.add("http://127.0.0.1:3000");
        origins.add("http://127.0.0.1:4000");
    }

    // Parse explicit ALLOWED_ORIGINS list
    if (env.ALLOWED_ORIGINS) {
        env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).forEach((o) => {
            if (o) origins.add(o);
        });
    }

    // Add WEB_URL and APP_URL if set
    if (env.WEB_URL) origins.add(env.WEB_URL);
    if (env.APP_URL) origins.add(env.APP_URL);

    return Array.from(origins);
})();

export const corsConfig = cors({
    origin: (origin) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return env.NODE_ENV === "development" ? "*" : "null";

        // Check against allowed origins
        if (allowedOrigins.includes(origin)) return origin;

        // In development, allow any localhost origin
        if (
            env.NODE_ENV === "development" &&
            (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1"))
        ) {
            return origin;
        }

        // Deny: return first allowed origin (Hono will reject the request)
        return allowedOrigins[0] ?? "null";
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Portal-Token", "X-AI-Secret"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 86400, // Cache preflight for 24 hours
});
