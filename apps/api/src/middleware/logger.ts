import { Context, Next } from "hono";

export const logger = () => async (c: Context, next: Next) => {
    const { method, url } = c.req;
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${c.res.status} (${duration}ms)`);
};
