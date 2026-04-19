"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, ChevronDown, PanelLeft } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
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
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const kbdHint = useSearchShortcutKbdHint();
  const workspaceName = useWorkspaceStore((s) => s.name) || "Workspace";

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  // Scroll-aware hide on scroll-down, show on scroll-up
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;
      if (currentY > 80 && diff > 6) {
        setHidden(true);
      } else if (diff < -4) {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
    setSearchFocused(true);
  }, []);

  const blurSearch = useCallback(() => {
    if (!searchValue) setSearchFocused(false);
  }, [searchValue]);

  const clearSearch = useCallback(() => {
    setSearchValue("");
    setSearchFocused(false);
    searchRef.current?.blur();
  }, []);

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        focusSearch();
      }
      if (e.key === "Escape" && searchFocused) {
        clearSearch();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusSearch, clearSearch, searchFocused]);

  // Collapse search on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        searchFocused &&
        !searchValue &&
        !searchWrapRef.current?.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [searchFocused, searchValue]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <motion.header
      animate={{ y: hidden ? "-100%" : 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center gap-2 border-b border-[rgb(var(--border-subtle))] bg-white/95 px-3 py-2 backdrop-blur-sm sm:gap-3 sm:px-4"
    >
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className={cn(
          "flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full text-[rgb(var(--text-secondary))] outline-none transition-all duration-150 lg:hidden",
          "hover:bg-[rgb(var(--surface-subtle))] focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2",
        )}
        aria-label="Open navigation"
      >
        <PanelLeft className="h-5 w-5" />
      </button>

      {/* Workspace name */}
      <div
        className={cn(
          "flex min-w-0 shrink items-center transition-all duration-200",
          searchFocused ? "max-w-0 overflow-hidden opacity-0 sm:max-w-none sm:opacity-100" : "max-w-[180px] sm:max-w-[220px]",
        )}
      >
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
          <span className="truncate font-serif text-base tracking-[-0.02em]">
            {workspaceName}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-[rgb(var(--text-muted))]"
            aria-hidden
          />
        </button>
      </div>

      {/* Search bar — expands on focus */}
      <div
        ref={searchWrapRef}
        className={cn(
          "order-3 flex min-w-0 justify-center px-0 transition-all duration-200 ease-out sm:order-none sm:flex-1 sm:px-2",
          searchFocused
            ? "basis-full sm:basis-auto"
            : "basis-full sm:basis-auto",
        )}
      >
        <div
          className={cn(
            "relative transition-all duration-200 ease-out",
            searchFocused ? "w-full max-w-2xl" : "w-full max-w-xl",
          )}
        >
          <Search
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-150",
              searchFocused
                ? "text-[rgb(var(--primary))]"
                : "text-[rgb(var(--text-muted))]",
            )}
            aria-hidden
          />
          <input
            ref={searchRef}
            type="search"
            name="global-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={blurSearch}
            placeholder="Search projects, briefs, clients…"
            autoComplete="off"
            className={cn(
              "h-9 w-full rounded-lg border py-2 pl-9 pr-16 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] outline-none transition-all duration-200",
              searchFocused
                ? "border-[rgb(var(--primary))]/40 bg-white ring-2 ring-[rgb(var(--primary))]/15 shadow-sm"
                : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))]",
            )}
          />

          {/* Right slot: clear button when typing, kbd hint when idle */}
          {searchValue ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd
              className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-[rgb(var(--border-default))] bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-[rgb(var(--text-muted))] sm:inline-block"
              aria-hidden
            >
              {kbdHint}
            </kbd>
          )}
        </div>
      </div>

      {/* Right actions */}
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
    </motion.header>
  );
}
