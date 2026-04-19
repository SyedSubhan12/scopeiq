"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isOnboarded: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    isOnboarded: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
    const isOnboarded = useWorkspaceStore((s) => s.isOnboarded);
    const hydrated = useWorkspaceStore((s) => s.hydrated);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // 1. Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (session) {
                syncSessionToCookie(session);
                // Hydrate workspace store when we have a session
                void hydrateWorkspace();
            }
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                syncSessionToCookie(session);
                void hydrateWorkspace();
            } else if (event === "SIGNED_OUT") {
                clearAuthCookie();
                useWorkspaceStore.getState().reset();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Client-side redirect: not onboarded → /onboarding
    useEffect(() => {
        if (loading || !hydrated || !session) return;

        const isOnboardingRoute = pathname.startsWith("/onboarding");
        const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
        const isPortalRoute = pathname.startsWith("/portal");

        // Skip redirect for auth, portal, and API routes
        if (isAuthRoute || isPortalRoute) return;

        if (!isOnboarded && !isOnboardingRoute) {
            router.replace("/onboarding");
        } else if (isOnboarded && isOnboardingRoute) {
            router.replace("/dashboard");
        }
    }, [loading, hydrated, isOnboarded, session, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, session, loading, isOnboarded }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

/**
 * The shared Supabase browser client now keeps auth cookies in sync for us.
 * This no-op remains only to preserve existing call sites.
 */
function syncSessionToCookie(_session: Session | null) {
    // Intentionally empty.
}

function clearAuthCookie() {
    // Supabase clears its own auth cookies during sign-out.
    // Clear only the onboarding hint cookie we manage locally.
    const secure =
        typeof window !== "undefined" && window.location.protocol === "https:";
    const secureAttr = secure ? "; Secure" : "";

    document.cookie = `x-onboarded=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
}
