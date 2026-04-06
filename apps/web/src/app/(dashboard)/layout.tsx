"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@novabots/ui";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarPinned = useUIStore((s) => s.sidebarPinned);

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
