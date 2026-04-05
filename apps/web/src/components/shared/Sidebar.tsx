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
  HelpCircle,
  Zap,
  BarChart2,
  History,
  CreditCard,
} from "lucide-react";
import { NavItem } from "./NavItem";
import { useUIStore } from "@/stores/ui.store";
import { cn, Button, Badge } from "@novabots/ui";
import { useScopeFlagCount } from "@/hooks/useScopeFlags";
import { useChangeOrderCount } from "@/hooks/useChangeOrders";

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const { data: flagCountData } = useScopeFlagCount();
  const { data: coCountData } = useChangeOrderCount();

  const flagCount = flagCountData?.data?.count ?? 0;
  const coCount = coCountData?.data?.count ?? 0;

  const mainNav = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/projects", icon: FolderKanban, label: "Projects" },
    { href: "/briefs", icon: FileText, label: "Briefs" },
    {
      href: "/scope-flags",
      icon: ShieldAlert,
      label: "Scope Flags",
      count: flagCount,
      urgent: true,
    },
    { href: "/clients", icon: Users, label: "Clients" },
    {
      href: "/change-orders",
      icon: FileSignature,
      label: "Change Orders",
      count: coCount,
    },
    { href: "/analytics", icon: BarChart2, label: "Analytics" },
    { href: "/activity", icon: History, label: "Activity" },
  ];

  const bottomNav = [
    { href: "/help", icon: HelpCircle, label: "Help & Docs" },
    { href: "/settings/billing", icon: CreditCard, label: "Billing" },
    { href: "/settings/team", icon: UsersRound, label: "Team" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

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

      <div className="p-3">
        {sidebarOpen && (
          <div className="mb-4 rounded-xl bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[rgb(var(--text-secondary))]">
                PLAN
              </span>
              <Badge status="active" className="bg-primary/10 text-primary border-none">
                PRO
              </Badge>
            </div>
            <p className="mb-3 text-[10px] leading-tight text-[rgb(var(--text-muted))]">
              Unlock AI scope detection and unlimited projects.
            </p>
            <Button size="sm" className="w-full text-[10px]">
              <Zap className="mr-1 h-3 w-3 fill-current" />
              Upgrade
            </Button>
          </div>
        )}

        <div className="border-t border-[rgb(var(--border-subtle))] pt-3">
          {bottomNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </div>
    </aside>
  );
}
