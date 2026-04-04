"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@novabots/ui";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen bg-[rgb(var(--surface-subtle))]">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-200",
          sidebarOpen ? "ml-[240px]" : "ml-[60px]",
        )}
      >
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
