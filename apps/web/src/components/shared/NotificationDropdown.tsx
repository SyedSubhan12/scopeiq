"use client";

import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FolderKanban,
  FileText,
  Shield,
  FileSignature,
  MessageSquare,
  Activity,
} from "lucide-react";
import { cn } from "@novabots/ui";
import { useNotificationStore, type AppNotification, type NotificationType } from "@/stores/notification.store";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const TYPE_ICON_MAP: Record<NotificationType, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const TYPE_COLOR_MAP: Record<NotificationType, string> = {
  info: "text-blue-500",
  success: "text-emerald-500",
  warning: "text-amber-500",
  error: "text-red-500",
};

const TYPE_BG_MAP: Record<NotificationType, string> = {
  info: "bg-blue-50 border-blue-200",
  success: "bg-emerald-50 border-emerald-200",
  warning: "bg-amber-50 border-amber-200",
  error: "bg-red-50 border-red-200",
};

const ENTITY_ICONS: Record<string, React.ElementType> = {
  project: FolderKanban,
  brief: FileText,
  scope_flag: Shield,
  change_order: FileSignature,
  feedback: MessageSquare,
};

function getEntityIcon(entityType?: string): React.ElementType {
  if (!entityType) return Activity;
  return ENTITY_ICONS[entityType] ?? Activity;
}

interface NotificationDropdownProps {
  onClose: () => void;
}

const MAX_VISIBLE = 10;

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, clearNotifications } =
    useNotificationStore();

  const visible = notifications.slice(0, MAX_VISIBLE);

  function handleNotificationClick(notification: AppNotification) {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.entityHref) {
      onClose();
      router.push(notification.entityHref);
    }
  }

  function handleMarkAllRead() {
    markAllAsRead();
  }

  function handleClearAll() {
    clearNotifications();
  }

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[rgb(var(--border-default))] bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--border-subtle))] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
          <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            Notifications
          </span>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all read
              </button>
              <span className="text-[rgb(var(--border-subtle))]">|</span>
            </>
          )}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-medium text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[360px] overflow-y-auto">
        {visible.length > 0 ? (
          <ul>
            {visible.map((notification) => {
              const TypeIcon = TYPE_ICON_MAP[notification.type];
              const EntityIcon = getEntityIcon(
                (notification as AppNotification & { entityType?: string }).entityType,
              );
              const isUnread = !notification.read;

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex w-full gap-3 border-b border-[rgb(var(--border-subtle))] px-4 py-3 text-left transition-colors last:border-b-0",
                      isUnread
                        ? "bg-[rgb(var(--surface-subtle))]"
                        : "bg-white",
                      "hover:bg-[rgb(var(--surface-subtle))]",
                    )}
                  >
                    {/* Type icon */}
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                        TYPE_BG_MAP[notification.type],
                      )}
                    >
                      <TypeIcon className={cn("h-4 w-4", TYPE_COLOR_MAP[notification.type])} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-1.5">
                        {isUnread && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug text-[rgb(var(--text-primary))]">
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-snug text-[rgb(var(--text-muted))]">
                            {notification.body}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <EntityIcon className="h-3 w-3 text-[rgb(var(--text-muted))]" />
                            <span className="text-[11px] text-[rgb(var(--text-muted))]">
                              {formatDistanceToNow(new Date(notification.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-12 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--text-muted))]" />
            <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              Activity and updates will appear here
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > MAX_VISIBLE && (
        <div className="border-t border-[rgb(var(--border-subtle))] px-4 py-2.5 text-center">
          <span className="text-xs text-[rgb(var(--text-muted))]">
            Showing {MAX_VISIBLE} of {notifications.length} notifications
          </span>
        </div>
      )}
    </div>
  );
}
