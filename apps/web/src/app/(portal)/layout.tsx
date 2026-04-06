"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { generatePortalTheme, applyPortalTheme } from "@/lib/portal-theme";

/**
 * Portal layout — clean client-facing layout with NO sidebar, NO topbar.
 * Applies workspace brand_color as CSS variables for dynamic theming.
 */
export default function PortalRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Extract the portal token from the URL path: /portal/[portalToken]/...
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const portalToken = segments.length >= 2 ? segments[1] : null;

    if (portalToken) {
      // Store token in memory
      const { setPortalToken } = require("@/lib/portal-auth");
      setPortalToken(portalToken);
    }

    // Default theme variables — will be overridden by validated workspace branding
    const defaultTheme = generatePortalTheme("#0F6E56");
    applyPortalTheme(defaultTheme);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-primary))]">
      {children}
    </div>
  );
}
