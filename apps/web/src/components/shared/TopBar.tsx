"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Avatar, DropdownMenu, DropdownItem } from "@novabots/ui";
import { useUIStore } from "@/stores/ui.store";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[rgb(var(--border-default))] bg-white px-6">
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

      <div className="flex items-center gap-3">
        <button className="relative rounded-md p-1.5 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]">
          <Bell className="h-5 w-5" />
        </button>

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
