"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  Menu,
  FolderKanban,
  FileText,
  Shield,
  FileSignature,
  MessageSquare,
  Activity,
} from "lucide-react";
import { Avatar, DropdownMenu, DropdownItem, cn } from "@novabots/ui";
import { useUIStore } from "@/stores/ui.store";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useNotifications, useUnreadNotificationCount } from "@/hooks/useNotifications";
import type { AuditLogEntry } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const ENTITY_ICONS: Record<string, React.ElementType> = {
  project: FolderKanban,
  brief: FileText,
  scope_flag: Shield,
  change_order: FileSignature,
  feedback: MessageSquare,
};

function getEntityIcon(entityType: string): React.ElementType {
  return ENTITY_ICONS[entityType] ?? Activity;
}

function formatNotificationText(item: AuditLogEntry): string {
  const actor = item.actorName ?? "Someone";
  const entity = item.entityType.replace(/_/g, " ");

  switch (item.action) {
    case "create":
      return `${actor} created a ${entity}`;
    case "update":
      return `${actor} updated a ${entity}`;
    case "delete":
      return `${actor} deleted a ${entity}`;
    case "approve":
      return `${actor} approved the ${entity}`;
    case "reject":
      return `${actor} rejected the ${entity}`;
    case "flag":
      return `${actor} flagged a scope deviation`;
    case "dismiss":
      return `${actor} dismissed a scope flag`;
    case "send":
      return `${actor} sent ${entity} to client`;
    case "score":
      return `AI scored a ${entity}`;
    default:
      return `${actor} performed ${item.action} on ${entity}`;
  }
}

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const router = useRouter();

  const { data: notificationsData } = useNotifications(10);
  const unreadCount = useUnreadNotificationCount();

  const [panelOpen, setPanelOpen] = useState(false);
  const [markedAllRead, setMarkedAllRead] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifications = notificationsData?.data ?? [];
  const showBadge = !markedAllRead && unreadCount > 0;

  // Close panel on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [panelOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleMarkAllRead() {
    setMarkedAllRead(true);
    setPanelOpen(false);
  }

  function handleViewAll() {
    setPanelOpen(false);
    router.push("/activity");
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[rgb(var(--border-default))] bg-white px-6">
      {/* Left: sidebar toggle + search */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            type="text"
            placeholder="Search projects, clients..."
            className="h-9 w-64 rounded-lg border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Right: notification bell + avatar */}
      <div className="flex items-center gap-3">
        {/* Notification bell with custom dropdown */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => {
              setPanelOpen((prev) => !prev);
              if (!panelOpen) setMarkedAllRead(false);
            }}
            className={cn(
              "relative rounded-md p-1.5 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))] transition-colors",
              panelOpen && "bg-[rgb(var(--surface-subtle))]",
            )}
            aria-label="Notifications"
            aria-expanded={panelOpen}
          >
            <Bell className="h-5 w-5" />
            {showBadge && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-red ring-2 ring-white" />
            )}
          </button>

          {panelOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[rgb(var(--border-default))] bg-white shadow-xl z-50 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-[rgb(var(--border-subtle))] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
                  <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                    Notifications
                  </span>
                  {showBadge && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-status-red px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Mark all read
                </button>
              </div>

              {/* Notification list */}
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length > 0 ? (
                  <ul>
                    {notifications.map((item: AuditLogEntry) => {
                      const Icon = getEntityIcon(item.entityType);
                      return (
                        <li
                          key={item.id}
                          className="flex gap-3 px-4 py-3 hover:bg-[rgb(var(--surface-subtle))] transition-colors border-b border-[rgb(var(--border-subtle))] last:border-b-0"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))] border border-[rgb(var(--border-default))]">
                            <Icon className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-[rgb(var(--text-primary))] leading-snug">
                              {formatNotificationText(item)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[rgb(var(--text-muted))]">
                              {formatDistanceToNow(new Date(item.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="py-10 text-center">
                    <Bell className="mx-auto mb-2 h-8 w-8 text-[rgb(var(--text-muted))]" />
                    <p className="text-sm text-[rgb(var(--text-muted))]">
                      No notifications yet
                    </p>
                  </div>
                )}
              </div>

              {/* Panel footer */}
              <div className="border-t border-[rgb(var(--border-subtle))] px-4 py-2.5 text-center">
                <button
                  onClick={handleViewAll}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <DropdownMenu
          trigger={
            <button className="flex items-center gap-2">
              <Avatar name="User" size="sm" />
            </button>
          }
        >
          <DropdownItem onClick={() => router.push("/settings")}>Settings</DropdownItem>
          <DropdownItem destructive onClick={handleLogout}>
            Sign out
          </DropdownItem>
        </DropdownMenu>
      </div>
    </header>
  );
}
