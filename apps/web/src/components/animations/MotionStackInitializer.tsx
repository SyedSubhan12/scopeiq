"use client";

import { useEffect } from "react";
import { initLenis } from "@/animations/utils/lenis.config";
import { initBarba } from "@/animations/utils/barba.config";
import { usePathname } from "next/navigation";

/**
 * Global Motion Stack Initializer.
 * Only runs once on the client to boot Lenis (smooth scroll) and Barba (transitions).
 */
export function MotionStackInitializer({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window === "undefined") return;

        const init = async () => {
            initLenis();
            await initBarba();
        };

        init();

        return () => {
            // Cleanup if needed, but these are meist singleton orchestrators
        };
    }, []);

    return (
        <div id="barba-wrapper" data-barba="wrapper">
            {/* 
                We use key={pathname} to force a container swap for Barba 
                when Next.js navigates, allowing our GSAP transitions to fire.
            */}
            <div
                key={pathname}
                data-barba="container"
                data-barba-namespace={pathname.startsWith("/onboarding") ? "onboarding" : "dashboard"}
                className="min-h-screen"
            >
                {children}
            </div>
        </div>
    );
}
