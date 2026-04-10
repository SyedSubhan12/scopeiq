import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    PORT: z.string().optional().default("4000"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().optional(),
    APP_URL: z.string().url().optional(),
    WEB_URL: z.string().url().optional(),
    ALLOWED_ORIGINS: z.string().optional(),
    EMAIL_APPROVAL_SECRET: z.string().min(32),
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    AI_CALLBACK_SECRET: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);

declare global {
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envSchema> { }
    }
}
