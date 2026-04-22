"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  ChevronLeft,
  ChevronsRight,
  FileSignature,
  FileText,
  FolderKanban,
  HelpCircle,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  Pin,
  PinOff,
  Settings,
  ShieldAlert,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge, cn } from "@novabots/ui";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { useChangeOrderCount } from "@/hooks/change-orders";
import { useScopeFlagCount } from "@/hooks/useScopeFlags";
import { useUIStore } from "@/stores/ui.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

const COLLAPSED_WIDTH = "lg:w-[72px]";
const EXPANDED_WIDTH = "lg:w-[264px]";

type NavDef = {
  href: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  urgent?: boolean;
};

function SidebarSectionLabel({
  children,
  expanded,
}: {
  children: React.ReactNode;
  expanded: boolean;
}) {
  if (!expanded) {
    return <div className="h-3" aria-hidden />;
  }

  return (
    <p className="px-3 font-mono text-[9.5px] font-medium uppercase tracking-[0.22em] text-[rgb(var(--text-muted))]">
      {children}
    </p>
  );
}

function SidebarLink({
  item,
  pathname,
  expanded,
  onNavigate,
}: {
  item: NavDef;
  pathname: string;
  expanded: boolean;
  onNavigate: (() => void) | undefined;
}) {
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  return (
    <div className="sidebar-tooltip-wrapper">
      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        data-tooltip={item.label}
        {...(onNavigate ? { onClick: onNavigate } : {})}
        className={cn(
          "nav-shimmer relative group flex items-center rounded-2xl border text-sm font-medium transition-colors duration-200",
          expanded ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-3",
          isActive
            ? "border-primary/15 text-[rgb(var(--primary-dark))] shadow-[0_10px_30px_-24px_rgba(15,110,86,0.9)]"
            : "border-transparent text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-subtle))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]",
        )}
      >
        {/* Sliding active background — shares layoutId across all nav items */}
        {isActive && (
          <motion.span
            layoutId="sidebar-active-pill"
            className="absolute inset-0 rounded-2xl bg-primary-light"
            style={{ zIndex: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
          />
        )}
        <span className="relative z-10 inline-flex shrink-0 items-center justify-center">
          <item.icon
            className={cn(
              "h-5 w-5 shrink-0 transition-transform duration-200",
              isActive
                ? "text-[rgb(var(--primary))]"
                : "text-[rgb(var(--text-secondary))] group-hover:scale-105 group-hover:text-[rgb(var(--text-primary))]",
            )}
            aria-hidden
          />
          {!expanded && item.count !== undefined && item.count > 0 ? (
            <span
              data-testid={
                item.href === "/change-orders"
                  ? "sidebar-change-order-count"
                  : item.href === "/scope-flags"
                    ? "sidebar-scope-flag-count"
                    : undefined
              }
              className={cn(
                "absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-white",
                item.urgent ? "bg-status-red" : "bg-primary",
              )}
            >
              {item.count > 9 ? "9+" : item.count}
            </span>
          ) : null}
        </span>
        {expanded ? (
          <>
            <span className="relative z-10 min-w-0 flex-1 truncate">{item.label}</span>
            {item.count !== undefined && item.count > 0 ? (
              <span
                data-testid={
                  item.href === "/change-orders"
                    ? "sidebar-change-order-count"
                    : item.href === "/scope-flags"
                      ? "sidebar-scope-flag-count"
                      : undefined
                }
                className={cn(
                  "relative z-10 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  item.urgent
                    ? "bg-status-red text-white"
                    : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))]",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </>
        ) : null}
      </Link>
      <span className="sidebar-tooltip" aria-hidden="true">{item.label}</span>
    </div>
  );
}

const navStagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } } },
  item: { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.22 } } },
};

function SidebarPanel({
  pathname,
  expanded,
  workspaceName,
  plan,
  mainItems,
  insightItems,
  supportItems,
  onNavigate,
  onLogout,
  hideHeader = false,
}: {
  pathname: string;
  expanded: boolean;
  workspaceName: string;
  plan: "solo" | "studio" | "agency";
  mainItems: NavDef[];
  insightItems: NavDef[];
  supportItems: NavDef[];
  onNavigate: (() => void) | undefined;
  onLogout: () => Promise<void>;
  hideHeader?: boolean;
}) {
  return (
    <>
      {!hideHeader && (
        <div className="flex h-16 items-center border-b border-[rgb(var(--border-subtle))] px-3">
          <Link
            href="/dashboard"
            {...(onNavigate ? { onClick: onNavigate } : {})}
            className={cn(
              "flex min-w-0 items-center rounded-2xl transition-colors hover:bg-[rgb(var(--surface-subtle))]",
              expanded ? "gap-3 px-2 py-2" : "mx-auto h-11 w-11 justify-center",
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--primary-dark))] font-serif text-sm font-bold tracking-[0.18em] text-white shadow-[0_16px_30px_-20px_rgba(10,88,67,0.85)]">
              SQ
            </span>
            {expanded ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                  {workspaceName}
                </span>
                <span className="block text-xs text-[rgb(var(--text-muted))]">
                  ScopeIQ workspace
                </span>
              </span>
            ) : null}
          </Link>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div
          className={cn(
            "space-y-6 px-3 py-4",
            expanded ? "sidebar-expanded-mode" : "sidebar-collapsed-mode",
          )}
        >
          <section className="space-y-2">
            <SidebarSectionLabel expanded={expanded}>Workspace</SidebarSectionLabel>
            <motion.div
              className="space-y-1.5"
              variants={navStagger.container}
              initial="hidden"
              animate="show"
            >
              {mainItems.map((item) => (
                <motion.div key={item.href} variants={navStagger.item}>
                  <SidebarLink
                    item={item}
                    pathname={pathname}
                    expanded={expanded}
                    onNavigate={onNavigate}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>

          <section className="space-y-2">
            <SidebarSectionLabel expanded={expanded}>Insights</SidebarSectionLabel>
            <motion.div
              className="space-y-1.5"
              variants={navStagger.container}
              initial="hidden"
              animate="show"
            >
              {insightItems.map((item) => (
                <motion.div key={item.href} variants={navStagger.item}>
                  <SidebarLink
                    item={item}
                    pathname={pathname}
                    expanded={expanded}
                    onNavigate={onNavigate}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>

          <section className="space-y-2">
            <SidebarSectionLabel expanded={expanded}>Support</SidebarSectionLabel>
            <motion.div
              className="space-y-1.5"
              variants={navStagger.container}
              initial="hidden"
              animate="show"
            >
              {supportItems.map((item) => (
                <motion.div key={item.href} variants={navStagger.item}>
                  <SidebarLink
                    item={item}
                    pathname={pathname}
                    expanded={expanded}
                    onNavigate={onNavigate}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </div>
      </ScrollArea>

      <div className="border-t border-[rgb(var(--border-subtle))] p-3">
        {expanded ? (
          <div className="rounded-3xl border border-[rgb(var(--border-subtle))] bg-[linear-gradient(180deg,#FFFFFF_0%,rgb(var(--surface-subtle))_100%)] p-3 shadow-[0_24px_50px_-36px_rgba(11,11,11,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                  Plan
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-[rgb(var(--text-primary))]">
                  {plan}
                </p>
              </div>
              <Badge status="active" className="border-none bg-primary-light text-primary-dark">
                Live
              </Badge>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
              Keep delivery, approvals, and analytics in one workspace shell.
            </p>
            <Link
              href="/settings/billing"
              {...(onNavigate ? { onClick: onNavigate } : {})}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--primary-dark))] px-4 text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--primary))]"
            >
              <Zap className="h-4 w-4" aria-hidden />
              Manage plan
            </Link>
          </div>
        ) : (
          <div className="sidebar-tooltip-wrapper sidebar-collapsed-mode">
            <Link
              href="/settings/billing"
              aria-label="Manage plan"
              {...(onNavigate ? { onClick: onNavigate } : {})}
              className="nav-shimmer mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--primary-dark))] text-white transition-colors hover:bg-[rgb(var(--primary))]"
            >
              <Zap className="h-4 w-4" aria-hidden />
            </Link>
            <span className="sidebar-tooltip" aria-hidden="true">Manage plan</span>
          </div>
        )}

        <div className={cn("sidebar-tooltip-wrapper", expanded ? "sidebar-expanded-mode" : "sidebar-collapsed-mode")}>
          <button
            type="button"
            onClick={() => void onLogout()}
            className={cn(
              "nav-shimmer mt-3 flex w-full items-center rounded-2xl text-sm font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]",
              expanded ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-3",
            )}
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            {expanded ? <span>Log out</span> : null}
          </button>
          <span className="sidebar-tooltip" aria-hidden="true">Log out</span>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const sidebarPinned = useUIStore((state) => state.sidebarPinned);
  const sidebarHoverOpen = useUIStore((state) => state.sidebarHoverOpen);
  const setSidebarPinned = useUIStore((state) => state.setSidebarPinned);
  const setSidebarHoverOpen = useUIStore((state) => state.setSidebarHoverOpen);
  const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useUIStore((state) => state.setMobileSidebarOpen);
  const workspaceName = useWorkspaceStore((state) => state.name) || "ScopeIQ";
  const plan = useWorkspaceStore((state) => state.plan);

  const { data: flagCountData } = useScopeFlagCount();
  const { data: changeOrderCountData } = useChangeOrderCount();

  const flagCount = flagCountData?.data?.count ?? 0;
  const changeOrderCount = changeOrderCountData?.data?.count ?? 0;
  const expanded = sidebarPinned || sidebarHoverOpen;

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  const mainItems: NavDef[] = [
    { href: "/", icon: Home, label: "Home" },
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
      count: changeOrderCount,
    },
  ];

  const insightItems: NavDef[] = [
    { href: "/analytics", icon: BarChart2, label: "Analytics" },
    { href: "/activity", icon: History, label: "Activity" },
  ];

  const supportItems: NavDef[] = [
    { href: "/help", icon: HelpCircle, label: "Help & Docs" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <div
        className="fixed inset-y-0 left-0 z-40 hidden lg:block"
        onMouseEnter={() => setSidebarHoverOpen(true)}
        onMouseLeave={() => {
          if (!sidebarPinned) {
            setSidebarHoverOpen(false);
          }
        }}
      >
        <aside
          aria-label="Application sidebar"
          className={cn(
            "relative flex h-full flex-col border-r border-[rgb(var(--border-subtle))] bg-white shadow-[16px_0_40px_-36px_rgba(11,11,11,0.22)] transition-[width] duration-200 ease-out",
            COLLAPSED_WIDTH,
            expanded && EXPANDED_WIDTH,
          )}
        >
          {/* Pin toggle — appears on hover */}
          <button
            type="button"
            onClick={() => setSidebarPinned(!sidebarPinned)}
            className={cn(
              "sidebar-pin-toggle",
              sidebarPinned && "pinned opacity-100",
            )}
            aria-label={sidebarPinned ? "Unpin sidebar" : "Pin sidebar open"}
            title={sidebarPinned ? "Unpin sidebar" : "Pin sidebar open"}
          >
            {sidebarPinned ? (
              <PinOff aria-hidden />
            ) : (
              <Pin aria-hidden />
            )}
          </button>

          <SidebarPanel
            pathname={pathname}
            expanded={expanded}
            workspaceName={workspaceName}
            plan={plan}
            mainItems={mainItems}
            insightItems={insightItems}
            supportItems={supportItems}
            onNavigate={undefined}
            onLogout={handleLogout}
          />
        </aside>
      </div>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            key="mobile-drawer"
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Backdrop */}
            <motion.button
              type="button"
              className="absolute inset-0 bg-slate-950/45"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Drawer */}
            <motion.aside
              aria-label="Mobile navigation"
              className="relative z-10 flex h-full w-[min(88vw,320px)] flex-col border-r border-[rgb(var(--border-subtle))] bg-white shadow-[16px_0_48px_-28px_rgba(11,11,11,0.38)]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="flex items-center justify-between border-b border-[rgb(var(--border-subtle))] px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--primary-dark))] font-serif text-sm font-bold tracking-[0.18em] text-white">
                    SQ
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{workspaceName}</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      {session ? "Signed in" : "Workspace shell"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgb(var(--border-subtle))] text-[rgb(var(--text-secondary))] transition-colors hover:text-[rgb(var(--text-primary))]"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <SidebarPanel
                pathname={pathname}
                expanded={true}
                workspaceName={workspaceName}
                plan={plan}
                mainItems={mainItems}
                insightItems={insightItems}
                supportItems={supportItems}
                onNavigate={() => setMobileSidebarOpen(false)}
                onLogout={handleLogout}
                hideHeader={true}
              />
            </motion.aside>

            {/* FAB close */}
            <motion.button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--primary-dark))] text-white shadow-lg"
              aria-label="Close navigation"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.15, type: "spring", damping: 20 }}
            >
              <PanelLeftClose className="h-5 w-5" aria-hidden />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
