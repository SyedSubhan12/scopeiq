"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  PanelLeft,
} from "lucide-react";
import { Avatar, DropdownMenu, DropdownItem, cn } from "@novabots/ui";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { NotificationBell } from "./NotificationBell";

function useSearchShortcutKbdHint(): string {
  const [hint, setHint] = useState("⌘K");
  useEffect(() => {
    const isMac =
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
    setHint(isMac ? "⌘K" : "Ctrl K");
  }, []);
  return hint;
}

export function TopBar() {
  const router = useRouter();
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const searchRef = useRef<HTMLInputElement>(null);
  const kbdHint = useSearchShortcutKbdHint();
  const workspaceName = useWorkspaceStore((s) => s.name) || "Workspace";

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center gap-3 border-b border-[rgb(var(--border-subtle))] bg-white/95 px-3 py-2 backdrop-blur-sm sm:gap-4 sm:px-4">
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[rgb(var(--text-secondary))] outline-none transition-colors duration-200 lg:hidden",
          "hover:bg-[rgb(var(--surface-subtle))] focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2",
        )}
        aria-label="Open navigation"
      >
        <PanelLeft className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 max-w-[min(100%,180px)] shrink items-center sm:max-w-[min(100%,220px)]">
        <button
          type="button"
          className={cn(
            "flex min-w-0 max-w-full items-center gap-1 rounded-lg py-1.5 pl-2 pr-1.5 text-left text-sm font-semibold text-[rgb(var(--text-primary))] outline-none transition-colors duration-200",
            "hover:bg-[rgb(var(--surface-subtle))] focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2",
          )}
          aria-haspopup="true"
          aria-expanded={false}
          aria-label="Workspace"
        >
          <span className="truncate font-serif text-base tracking-[-0.02em]">{workspaceName}</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-[rgb(var(--text-muted))]"
            aria-hidden
          />
        </button>
      </div>

      <div className="order-3 flex min-w-0 basis-full justify-center px-0 sm:order-none sm:basis-auto sm:flex-1 sm:px-2">
        <div className="relative w-full max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]"
            aria-hidden
          />
          <input
            ref={searchRef}
            type="search"
            name="global-search"
            placeholder="Search…"
            autoComplete="off"
            className="h-9 w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] py-2 pl-9 pr-16 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] outline-none transition-[border-color,box-shadow] duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
          <kbd
            className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-[rgb(var(--border-default))] bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-[rgb(var(--text-muted))] sm:inline-block"
            aria-hidden
          >
            {kbdHint}
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
        <NotificationBell />

        <DropdownMenu
          trigger={
            <button
              type="button"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full outline-none transition-colors duration-200",
                "hover:bg-[rgb(var(--surface-subtle))] focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2",
              )}
              aria-label="Account menu"
            >
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
