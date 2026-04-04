"use client";

import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  ShieldAlert,
  Users,
  FileSignature,
  Settings,
  UsersRound,
} from "lucide-react";
import { NavItem } from "./NavItem";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@novabots/ui";

const mainNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/briefs", icon: FileText, label: "Briefs" },
  { href: "/scope-flags", icon: ShieldAlert, label: "Scope Flags", urgent: true },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/change-orders", icon: FileSignature, label: "Change Orders" },
];

const bottomNav = [
  { href: "/settings/team", icon: UsersRound, label: "Team" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-[rgb(var(--border-default))] bg-white transition-all duration-200",
        sidebarOpen ? "w-[240px]" : "w-[60px]",
      )}
    >
      <div className="flex h-14 items-center border-b border-[rgb(var(--border-subtle))] px-4">
        <span className="text-lg font-bold text-primary">
          {sidebarOpen ? "ScopeIQ" : "S"}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="border-t border-[rgb(var(--border-subtle))] p-3">
        {bottomNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>
    </aside>
  );
}
