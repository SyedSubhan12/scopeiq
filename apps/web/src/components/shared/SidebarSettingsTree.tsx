"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import { cn } from "@novabots/ui";

const LINKS = [
  { href: "/settings", label: "General" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/billing", label: "Billing" },
] as const;

export function SidebarSettingsTree() {
  const pathname = usePathname();
  const underSettings = pathname.startsWith("/settings");
  const [open, setOpen] = useState(underSettings);

  useEffect(() => {
    setOpen(underSettings);
  }, [underSettings]);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger
        type="button"
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium outline-none transition-colors duration-200",
          "text-white/75 hover:bg-white/10 hover:text-white",
          "focus-visible:ring-2 focus-visible:ring-primary-mid/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--primary-dark))]",
          underSettings && !open && "bg-white/10 text-white",
        )}
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-white/70 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
        <Settings className="h-5 w-5 shrink-0 text-white/85" aria-hidden />
        <span className="min-w-0 flex-1 truncate">Settings</span>
      </Collapsible.Trigger>
      <Collapsible.Content className="overflow-hidden data-[state=closed]:hidden">
        <div className="space-y-0.5 border-l border-white/15 py-1 pl-3 ml-3">
          {LINKS.map(({ href, label }) => {
            const active =
              href === "/settings"
                ? pathname === "/settings"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "block rounded-md px-2 py-1.5 text-xs font-medium outline-none transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/65 hover:bg-white/10 hover:text-white",
                  "focus-visible:ring-2 focus-visible:ring-primary-mid/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[rgb(var(--primary-dark))]",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
