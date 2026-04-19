import * as React from "react";
import { cn } from "./utils.js";

/* -----------------------------------------------------------------------
   Avatar sizes
   ----------------------------------------------------------------------- */

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
} as const;

type AvatarSize = keyof typeof sizeMap;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* -----------------------------------------------------------------------
   Avatar
   ----------------------------------------------------------------------- */

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  /** Show green online indicator dot */
  online?: boolean;
  className?: string;
}

export function Avatar({
  src,
  name,
  size = "md",
  online,
  className,
}: AvatarProps) {
  const base = cn(
    "relative inline-flex shrink-0 items-center justify-center rounded-full font-medium",
    sizeMap[size],
    className,
  );

  const dotSize =
    size === "xs" || size === "sm"
      ? "h-2 w-2 border"
      : size === "xl"
        ? "h-3.5 w-3.5 border-2"
        : "h-2.5 w-2.5 border-2";

  const inner = src ? (
    <img
      src={src}
      alt={name}
      className="h-full w-full rounded-full object-cover"
    />
  ) : (
    <div
      className="flex h-full w-full items-center justify-center rounded-full bg-primary-light font-medium text-primary"
    >
      {getInitials(name)}
    </div>
  );

  if (online !== undefined) {
    return (
      <span className={base}>
        {inner}
        <span
          aria-label={online ? "Online" : "Offline"}
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-white",
            online ? "bg-[rgb(var(--status-green))]" : "bg-[rgb(var(--border-strong))]",
            dotSize,
          )}
        />
      </span>
    );
  }

  return <span className={base}>{inner}</span>;
}

/* -----------------------------------------------------------------------
   AvatarGroup — overlapping stack with overflow count badge
   ----------------------------------------------------------------------- */

interface AvatarGroupMember {
  name: string;
  src?: string | null | undefined;
}

interface AvatarGroupProps {
  members: AvatarGroupMember[];
  /** Max avatars to show before the +N badge. Default 4 */
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  members,
  max = 4,
  size = "sm",
  className,
}: AvatarGroupProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  const ringMap: Record<AvatarSize, string> = {
    xs: "ring-1",
    sm: "ring-2",
    md: "ring-2",
    lg: "ring-[3px]",
    xl: "ring-[3px]",
  };

  const negMarginMap: Record<AvatarSize, string> = {
    xs: "-ml-1.5",
    sm: "-ml-2",
    md: "-ml-2.5",
    lg: "-ml-3",
    xl: "-ml-4",
  };

  return (
    <div
      className={cn("flex items-center", className)}
      role="group"
      aria-label={`${members.length} member${members.length !== 1 ? "s" : ""}`}
    >
      {visible.map((m, i) => (
        <span
          key={m.name + i}
          title={m.name}
          className={cn(
            "ring-white",
            ringMap[size],
            i > 0 && negMarginMap[size],
          )}
          style={{ zIndex: visible.length - i }}
        >
          <Avatar src={m.src ?? null} name={m.name} size={size} />
        </span>
      ))}

      {overflow > 0 && (
        <span
          aria-label={`${overflow} more`}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full bg-[rgb(var(--surface-raised))] font-semibold text-[rgb(var(--text-secondary))] ring-white",
            sizeMap[size],
            ringMap[size],
            negMarginMap[size],
          )}
          style={{ zIndex: 0 }}
        >
          +{overflow > 99 ? "99" : overflow}
        </span>
      )}
    </div>
  );
}
