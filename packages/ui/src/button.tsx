"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./utils.js";

const variantStyles = {
  primary:
    "bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-dark))] shadow-sm hover:shadow-[0_4px_12px_rgba(15,110,86,0.3)] hover:-translate-y-px",
  secondary:
    "border border-[rgb(var(--primary))] text-[rgb(var(--primary))] bg-white hover:bg-[rgb(var(--primary-light))] hover:-translate-y-px",
  danger:
    "bg-[rgb(var(--status-red))] text-white hover:bg-[#dc2626] hover:shadow-[0_4px_12px_rgba(220,38,38,0.3)] hover:-translate-y-px",
  ghost:
    "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]",
  success:
    "bg-[rgb(var(--status-green))] text-white hover:bg-[#059669] hover:shadow-[0_4px_12px_rgba(5,150,105,0.3)] hover:-translate-y-px shadow-sm",
  warning:
    "bg-[rgb(var(--status-amber))] text-white hover:opacity-90 shadow-sm",
} as const;

const sizeStyles = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base font-semibold gap-2",
  xl: "h-14 px-8 text-lg font-semibold gap-2.5",
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
  /** When true, renders as a square icon button (width = height) */
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      iconOnly,
      children,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;

        const ripple = document.createElement("span");
        ripple.className = "btn-ripple";
        ripple.style.width = `${diameter}px`;
        ripple.style.height = `${diameter}px`;
        ripple.style.left = `${e.clientX - rect.left - radius}px`;
        ripple.style.top = `${e.clientY - rect.top - radius}px`;

        const existing = button.querySelector(".btn-ripple");
        if (existing) existing.remove();

        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        onClick?.(e);
      },
      [onClick],
    );

    const iconSizeStyles: Record<keyof typeof sizeStyles, string> = {
      sm: "w-8 px-0",
      md: "w-10 px-0",
      lg: "w-12 px-0",
      xl: "w-14 px-0",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative overflow-hidden inline-flex items-center justify-center rounded-lg font-medium",
          "transition-all duration-[150ms] ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/50 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
          "active:scale-[0.97]",
          variantStyles[variant],
          sizeStyles[size],
          iconOnly && iconSizeStyles[size],
          className,
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

/* -----------------------------------------------------------------------
   Global CSS for ripple — injected once via a singleton style tag
   ----------------------------------------------------------------------- */
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
        background: rgba(255,255,255,0.3);
        transform: scale(0);
        animation: btnRipple 0.6s linear forwards;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }
}
