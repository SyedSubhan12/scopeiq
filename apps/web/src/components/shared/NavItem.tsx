"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@novabots/ui";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  urgent?: boolean;
}

export function NavItem({ href, icon: Icon, label, count, urgent }: NavItemProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary-light text-primary"
          : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold",
            urgent
              ? "bg-status-red text-white"
              : "bg-[rgb(var(--border-subtle))] text-[rgb(var(--text-secondary))]",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
