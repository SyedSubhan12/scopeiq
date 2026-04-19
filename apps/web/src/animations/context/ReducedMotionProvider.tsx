"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const ReducedMotionContext = createContext(false);

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    return (
        <ReducedMotionContext.Provider value={reducedMotion}>
            {children}
        </ReducedMotionContext.Provider>
    );
}

export const useReducedMotion = () => useContext(ReducedMotionContext);
