import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton — created only on first access, not at module import time.
// This prevents the build-time prerender crash when NEXT_PUBLIC_SUPABASE_URL
// and NEXT_PUBLIC_SUPABASE_ANON_KEY are absent (Vercel static generation phase).
let _client: SupabaseClient | null = null;

/**
 * Creates a recursive no-op proxy that prevents crashes when 
 * environment variables are missing (e.g., during build time).
 */
function createNoopProxy(): any {
    const noop = () => noop;
    return new Proxy(noop, {
        get: (target, prop) => {
            if (prop === 'then') {
                // Return a function that behaves like a settled promise
                return (resolve: any) => resolve(createNoopProxy());
            }
            return createNoopProxy();
        },
        apply: () => createNoopProxy(),
    });
}

function getSupabaseClient(): SupabaseClient {
    if (!_client) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key || url === "" || key === "") {
            if (typeof window !== 'undefined') {
                console.warn(
                    "ScopeIQ: Supabase environment variables are missing. " +
                    "Authentication and database features will be disabled. " +
                    "Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
                );
            }
            return createNoopProxy();
        }

        try {
            // In the browser, we use the local origin as the Supabase URL.
            // Next.js rewrites (/auth/v1/*) will proxy these calls to the real Supabase endpoint.
            // This masks the project ID from the browser's address bar during OAuth redirects.
            const clientUrl = typeof window !== 'undefined'
                ? window.location.origin
                : url;

            _client = createBrowserClient(clientUrl, key);
        } catch (e) {
            console.error("ScopeIQ: Failed to initialize Supabase client:", e);
            return createNoopProxy();
        }
    }
    return _client!;
}

// Re-export as a Proxy so all existing `supabase.auth.xxx()` call sites
// work without any changes — accessing any property triggers lazy init.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
