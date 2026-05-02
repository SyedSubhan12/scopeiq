import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const requestUrl = new URL(request.url);
    // FIND-010: never derive redirect origin from the request URL — Host header
    // is attacker-controlled. In production the env var is mandatory; in dev
    // we fall back to the request origin to avoid blocking local development.
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;
    if (!configuredOrigin && process.env.NODE_ENV === "production") {
        console.error("[auth/callback] NEXT_PUBLIC_APP_URL is required in production");
        return new NextResponse("Misconfigured", { status: 500 });
    }
    const appOrigin = configuredOrigin ?? requestUrl.origin;
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    if (error) {
        console.error("[auth/callback] OAuth error:", error, errorDescription);
        return NextResponse.redirect(`${appOrigin}/login?error=${encodeURIComponent(error)}`);
    }

    if (code) {
        try {
            const response = NextResponse.redirect(`${appOrigin}/dashboard`);
            const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
                cookies: {
                    getAll() {
                        return request.cookies.getAll().map(({ name, value }) => ({
                            name,
                            value,
                        }));
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, {
                                ...options,
                                httpOnly: true,
                                secure: process.env.NODE_ENV === "production",
                                sameSite: "lax",
                            });
                        });
                    },
                },
            });

            const { data: { session }, error: exchangeError } =
                await supabase.auth.exchangeCodeForSession(code);

            if (!exchangeError && session) {
                return response;
            } else {
                console.error("[auth/callback] Code exchange failed:", exchangeError?.message);
                return NextResponse.redirect(`${appOrigin}/login?error=exchange_failed`);
            }
        } catch (err) {
            console.error("[auth/callback] Unexpected error during callback:", err);
            return NextResponse.redirect(`${appOrigin}/login?error=callback_error`);
        }
    } else {
        return NextResponse.redirect(`${appOrigin}/login`);
    }
}
