"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";
import { useUIStore } from "@/stores/ui.store";
import { useRealtimeScopeFlags } from "@/hooks/useRealtimeScopeFlags";
import { useRealtimeApprovalEvents } from "@/hooks/useRealtimeApprovalEvents";
import { useRealtimeDashboardMetrics } from "@/hooks/useRealtimeDashboardMetrics";
import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@novabots/ui";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarPinned = useUIStore((s) => s.sidebarPinned);
  const { data: workspace } = useWorkspace();
  const workspaceId = workspace?.data?.id ?? null;

  // Real-time subscriptions for workspace overview counts and entity activity.
  useRealtimeDashboardMetrics(workspaceId);
  useRealtimeScopeFlags(workspaceId);
  useRealtimeApprovalEvents(workspaceId);

  return (
    <div className="min-h-screen bg-[rgb(var(--surface-subtle))]">
      <Sidebar />
      <div
        className={cn(
          "transition-[margin] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "lg:ml-[72px]",
          sidebarPinned && "lg:ml-[264px]",
        )}
      >
        <TopBar />
        <main className="px-4 py-4 sm:px-5 sm:py-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
