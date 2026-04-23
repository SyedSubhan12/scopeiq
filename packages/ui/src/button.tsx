"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./utils.js";

/**
 * Button — Level 1 Primitive
 *
 * Design System v1.0 specification:
 * - Default type is "button" (never "submit") — AP-003
 * - Loading state: disables button, replaces label with spinner, sets aria-busy — no layout shift
 * - Disabled + disabledReason: renders tooltip explaining why — WCAG 1.4.3
 * - Variants: primary | secondary | danger | ghost
 * - Sizes: sm (32px) | md (40px) | lg (48px)
 * - All colors reference CSS custom properties — never hardcoded hex — AP-001
 */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Height/padding tier — sm: 32px, md: 40px, lg: 48px */
  size?: ButtonSize;
  /** Shows spinner, hides label, disables button, sets aria-busy */
  loading?: boolean;
  /** Left-side icon */
  icon?: React.ReactNode;
  /** Right-side icon — use sparingly (directional ambiguity) */
  iconRight?: React.ReactNode;
  /** Stretches to container width */
  fullWidth?: boolean;
  /** Required: when disabled, explain why — rendered as title tooltip */
  disabledReason?: string;
  /** @deprecated Use iconOnly pattern via icon prop + no children */
  iconOnly?: boolean;
  /** Explicit type — defaults to "button" per AP-003 */
  type?: "button" | "submit" | "reset";
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--btn-primary-bg)] text-white",
    "hover:bg-[var(--btn-primary-bg-hover)]",
    "active:bg-[var(--btn-primary-bg-press)]",
    "shadow-[var(--shadow-sm)]",
    "focus-visible:ring-[var(--color-action-primary)]",
  ].join(" "),

  secondary: [
    "border border-[var(--color-action-primary)] text-[var(--color-action-primary)] bg-[var(--color-surface)]",
    "hover:bg-[var(--color-action-subtle)]",
    "focus-visible:ring-[var(--color-action-primary)]",
  ].join(" "),

  danger: [
    "bg-[var(--color-danger)] text-white",
    "hover:opacity-90",
    "active:opacity-100 active:brightness-90",
    "focus-visible:ring-[var(--color-danger)]",
  ].join(" "),

  ghost: [
    "text-[var(--color-text-mid)] bg-transparent",
    "hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-high)]",
    "focus-visible:ring-[var(--color-action-primary)]",
  ].join(" "),
};

/** sm: 32px, md: 40px, lg: 48px — matches spec table */
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[12px] font-[500] gap-1.5",
  md: "h-10 px-4 text-[14px] font-[500] gap-2",
  lg: "h-12 px-6 text-[16px] font-[500] gap-2",
};

const iconSizeMap: Record<ButtonSize, string> = {
  sm: "h-[14px] w-[14px]",
  md: "h-[16px] w-[16px]",
  lg: "h-[18px] w-[18px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      disabled,
      disabledReason,
      iconOnly,
      children,
      type = "button",  /* AP-003: never default to submit */
      onClick,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    /* Ripple effect — only on enabled pointer interactions */
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled) return;
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;
        const ripple = document.createElement("span");
        ripple.className = "btn-ripple";
        ripple.style.cssText = `width:${diameter}px;height:${diameter}px;left:${e.clientX - rect.left - radius}px;top:${e.clientY - rect.top - radius}px`;
        const existing = btn.querySelector(".btn-ripple");
        if (existing) existing.remove();
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
        onClick?.(e);
      },
      [isDisabled, onClick],
    );

    const iconSizeCls = iconSizeMap[size ?? "md"];

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "relative overflow-hidden inline-flex items-center justify-center rounded-[var(--radius-lg)]",
          "transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
          "active:scale-[0.97]",
          variantStyles[variant],
          sizeStyles[size],
          iconOnly && "px-0 aspect-square",
          fullWidth && "w-full",
          className,
        )}
        disabled={isDisabled}
        onClick={handleClick}
        /* Loading state — a11y: aria-busy + aria-label per spec Section 5.2 */
        aria-busy={loading ? "true" : undefined}
        aria-label={loading ? "Loading…" : undefined}
        /* Disabled reason — visible on hover/focus — WCAG 1.4.3 */
        title={disabled && disabledReason ? disabledReason : undefined}
        {...props}
      >
        {loading ? (
          <Loader2
            className={cn("animate-spin shrink-0", iconSizeCls)}
            aria-hidden="true"
          />
        ) : (
          <>
            {icon && (
              <span className={cn("shrink-0", iconSizeCls)} aria-hidden="true">
                {icon}
              </span>
            )}
            {children}
            {iconRight && (
              <span className={cn("shrink-0", iconSizeCls)} aria-hidden="true">
                {iconRight}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

/* Ripple keyframe — injected once via singleton style tag */
if (typeof document !== "undefined") {
  const STYLE_ID = "ui-btn-ripple-styles";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes btnRipple { to { transform: scale(4); opacity: 0; } }
      .btn-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.28);
        transform: scale(0);
        animation: btnRipple 0.6s linear forwards;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }
}
