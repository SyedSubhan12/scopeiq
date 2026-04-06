"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard } from "lucide-react";

export function HomeNavbar() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setLoggedIn(!!data.session);
            setChecking(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
            setLoggedIn(!!session);
        });
        return () => subscription.unsubscribe();
    }, []);

    return (
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                <span className="text-xl font-bold text-[#0F6E56]">ScopeIQ</span>

                <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
                    <a href="#features" className="hover:text-gray-900">Features</a>
                    <a href="#how-it-works" className="hover:text-gray-900">How it works</a>
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    {checking ? (
                        <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-100" />
                    ) : loggedIn ? (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 rounded-full bg-[#0F6E56] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a5c47]"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-full bg-[#0F6E56] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a5c47]"
                            >
                                Get started free
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
