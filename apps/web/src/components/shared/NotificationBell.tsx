"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { cn } from "@novabots/ui";
import { useNotificationStore } from "@/stores/notification.store";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [open, setOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const prevCountRef = useRef(unreadCount);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Trigger pulse animation when count increases
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setJustAdded(true);
      const timer = setTimeout(() => setJustAdded(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        open &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  const badgeCount = unreadCount > 9 ? "9+" : String(unreadCount);
  const showBadge = unreadCount > 0;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--text-secondary))] outline-none transition-colors duration-200",
          "hover:bg-[rgb(var(--surface-subtle))] focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2",
          open && "bg-[rgb(var(--surface-subtle))]",
          justAdded && "animate-pulse",
        )}
        aria-label={
          showBadge
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {showBadge && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-red px-1 text-[10px] font-bold text-white ring-2 ring-white",
              justAdded && "animate-bounce",
            )}
          >
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div ref={panelRef}>
          <NotificationDropdown onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
