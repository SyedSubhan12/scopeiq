import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const siteUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

/**
 * Server-side route handler for Supabase OAuth callback.
 * Using a manual implementation to avoid dependency resolution issues
 * while maintaining strict session and cookie synchronization.
 */
export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (code) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false,
            },
        });

        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && session) {
            const cookieStore = cookies();

            // Set the auth token cookie that the middleware and AuthProvider expect
            cookieStore.set("sb-supabase-auth-token", session.access_token, {
                path: "/",
                maxAge: session.expires_in,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
            });
        }
    }

    // Redirect to home or dashboard after successful auth
    // Use the configured site URL instead of requestUrl.origin
    return NextResponse.redirect(`${siteUrl}/`);
}
