"use client";

import { useEffect, useRef } from "react";
import { initLenis, destroyLenis, getLenis } from "@/animations/utils/lenis.config";

/**
 * Initialises Lenis smooth scroll for a page.
 * Returns the Lenis instance so callers can call .stop() / .start() / .scrollTo().
 * Automatically destroys on unmount to prevent duplicate RAF loops.
 */
export function useLenis() {
    const lenisRef = useRef(getLenis());

    useEffect(() => {
        if (!lenisRef.current) {
            lenisRef.current = initLenis();
        }
        return () => {
            destroyLenis();
            lenisRef.current = null;
        };
    }, []);

    return lenisRef;
}
