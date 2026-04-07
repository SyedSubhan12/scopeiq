import type { ReactNode } from "react";

/**
 * Portal layout — clean client-facing layout with NO sidebar, NO topbar.
 * Theme is injected server-side by the nested [portalToken]/layout.tsx
 * to eliminate flash of unstyled content.
 */
export default function PortalRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[rgb(var(--portal-surface-subtle))] text-[rgb(var(--text-primary))]">
      {children}
    </div>
  );
}
