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
  /** Icon-only rail (60px column). */
  rail?: boolean;
  /** Full label row inside flyout (dark surface). */
  flyout?: boolean;
  /** Which panel the pointer is in — suppresses hover on the other. */
  hoverSource?: "rail" | "flyout" | null;
}

export function NavItem({
  href,
  icon: Icon,
  label,
  count,
  urgent,
  rail = false,
  flyout = false,
  hoverSource,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  const ringOffset = flyout || rail ? "focus-visible:ring-offset-[rgb(var(--primary-dark))]" : "focus-visible:ring-offset-white";

  // Suppress hover on rail items when pointer is in flyout, and vice versa
  const isOtherPanel =
    (rail && hoverSource === "flyout") || (flyout && hoverSource === "rail");

  return (
    <Link
      href={href}
      title={rail ? label : undefined}
      aria-label={rail ? label : undefined}
      aria-current={isActive ? "page" : undefined}
      data-nav-variant={rail ? "rail" : flyout ? "flyout" : "default"}
      className={cn(
        "group relative flex items-center rounded-lg text-sm font-medium outline-none transition-all duration-200 ease-out",
        "focus-visible:ring-2 focus-visible:ring-primary-mid/60 focus-visible:ring-offset-2",
        ringOffset,
        "active:scale-[0.98]",
        rail ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
        flyout || rail
          ? isActive
            ? "bg-white/15 text-white shadow-sm"
            : isOtherPanel
              ? "text-white/75"
              : "text-white/75 hover:bg-white/10 hover:text-white"
          : isActive
            ? "bg-primary-light text-primary shadow-sm"
            : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]",
      )}
    >
      <span className="relative inline-flex shrink-0">
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-transform duration-200 ease-out",
            (flyout || rail) && (isActive ? "text-primary-light" : "text-white/85"),
            !flyout && !rail && isActive && "text-primary",
            !isActive && "group-hover:scale-105",
          )}
          aria-hidden
        />
        {rail && count !== undefined && count > 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold leading-none text-white",
              urgent ? "bg-status-red" : "bg-primary-mid",
            )}
            aria-hidden
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </span>
      {!rail && (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {count !== undefined && count > 0 && (
            <span
              className={cn(
                "min-w-[20px] shrink-0 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums",
                flyout
                  ? urgent
                    ? "bg-status-red text-white"
                    : "bg-white/20 text-white"
                  : urgent
                    ? "bg-status-red text-white"
                    : "bg-[rgb(var(--border-subtle))] text-[rgb(var(--text-secondary))]",
              )}
            >
              {count}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
