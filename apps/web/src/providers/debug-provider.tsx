"use client";

import React, { useEffect } from "react";

export function DebugProvider({ children }: { children: React.ReactNode }) {
    console.log("[SSR DEBUG] DebugProvider evaluated on " + (typeof window === "undefined" ? "SERVER" : "CLIENT"));

    useEffect(() => {
        console.log("[SSR DEBUG] DebugProvider mounted on CLIENT");
    }, []);

    return <>{children}</>;
}
