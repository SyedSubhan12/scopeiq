"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  FileSignature,
  FileText,
  FolderKanban,
  Home,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";
import { ScrollRevealObserver } from "@/components/shared/ScrollRevealObserver";
import { NpsPrompt } from "@/components/shared/NpsPrompt";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import { useUIStore } from "@/stores/ui.store";
import { useRealtimeScopeFlags } from "@/hooks/useRealtimeScopeFlags";
import { useRealtimeApprovalEvents } from "@/hooks/useRealtimeApprovalEvents";
import { useRealtimeDashboardMetrics } from "@/hooks/useRealtimeDashboardMetrics";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useScopeFlagCount } from "@/hooks/useScopeFlags";
import { cn } from "@novabots/ui";

const mobileNavItems = [
  { href: "/",          icon: Home,          label: "Home"     },
  { href: "/projects",  icon: FolderKanban,  label: "Projects" },
  { href: "/briefs",    icon: FileText,       label: "Briefs"   },
  { href: "/scope-flags", icon: ShieldAlert, label: "Flags"    },
  { href: "/settings",  icon: Settings,       label: "Settings" },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sidebarPinned = useUIStore((s) => s.sidebarPinned);
  useLenisScroll();
  const { data: workspace } = useWorkspace();
  const workspaceId = workspace?.data?.id ?? null;
  const { data: flagCountData } = useScopeFlagCount();
  const flagCount = flagCountData?.data?.count ?? 0;

  // Real-time subscriptions
  useRealtimeDashboardMetrics(workspaceId);
  useRealtimeScopeFlags(workspaceId);
  useRealtimeApprovalEvents(workspaceId);

  return (
    <div className="min-h-screen bg-[rgb(var(--surface-subtle))]">
      <ScrollRevealObserver />
      <Sidebar />

      {/* Main content shifts right based on sidebar state */}
      <div
        className={cn(
          "transition-[margin] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "lg:ml-[72px]",
          sidebarPinned && "lg:ml-[264px]",
        )}
      >
        <TopBar />
        {/* Extra bottom padding on mobile for the nav bar */}
        <main className="px-4 py-4 pb-24 sm:px-5 sm:py-5 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav bar ──────────────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className="mobile-nav-bar lg:hidden"
      >
        {mobileNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const showBadge = item.href === "/scope-flags" && flagCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "mobile-nav-item relative",
                isActive && "active",
              )}
            >
              <span className="relative">
                <item.icon className="h-[22px] w-[22px]" aria-hidden />
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[rgb(var(--status-red))] px-1 text-[9px] font-bold leading-none text-white">
                    {flagCount > 9 ? "9+" : flagCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <NpsPrompt />
    </div>
  );
}
