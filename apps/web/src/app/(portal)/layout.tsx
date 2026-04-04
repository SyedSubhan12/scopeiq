"use client";

import { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[rgb(var(--surface-subtle))]">
            {children}
        </div>
    );
}
