import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton — created only on first access, not at module import time.
// This prevents the build-time prerender crash when NEXT_PUBLIC_SUPABASE_URL
// and NEXT_PUBLIC_SUPABASE_ANON_KEY are absent (Vercel static generation phase).
let _client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!_client) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key || url === "" || key === "") {
            // Return a no-op proxy during build time if env vars are missing
            const noop = () => noop;
            return new Proxy({} as SupabaseClient, {
                get: () => noop,
            });
        }

        try {
            _client = createBrowserClient(url, key);
        } catch (e) {
            // Fallback for any other initialization errors
            const noop = () => noop;
            return new Proxy({} as SupabaseClient, {
                get: () => noop,
            });
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
