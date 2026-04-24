import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const requestUrl = new URL(request.url);
    const appOrigin = requestUrl.origin;
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    // Log any errors from Supabase
    if (error) {
        console.error('[auth/callback] Error from Supabase:', { error, error_description: errorDescription });
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
                            response.cookies.set(name, value, options);
                        });
                    },
                },
            });

            const { data: { session }, error: exchangeError } =
                await supabase.auth.exchangeCodeForSession(code);

            if (!exchangeError && session) {
                console.log('[auth/callback] Session obtained for user:', session.user.id);
                console.log(
                    '[auth/callback] Session cookies set:',
                    response.cookies.getAll().map((cookie) => cookie.name),
                );
                console.log('[auth/callback] Redirecting to dashboard');
                return response;
            } else {
                console.error('[auth/callback] Error exchanging code:', exchangeError);
                return NextResponse.redirect(`${appOrigin}/login?error=exchange_failed`);
            }
        } catch (err) {
            console.error('[auth/callback] Exception during callback:', err);
            return NextResponse.redirect(`${appOrigin}/login?error=callback_error`);
        }
    } else {
        console.warn('[auth/callback] No code found in request, redirecting to login');
        return NextResponse.redirect(`${appOrigin}/login`);
    }
}
