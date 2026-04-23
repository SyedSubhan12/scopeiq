import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Input — Level 1 Primitive
 *
 * Design System v1.0 spec Section 5.6.
 * Supports default, error, disabled, and focus states per spec.
 * Uses CSS custom properties — never hardcoded hex — AP-001.
 *
 * ⚠ Never use placeholder as a substitute for <label> — AP (Section 5.6)
 * ⚠ Never set autocomplete="off" on name/email fields — degrades UX
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Puts input into error state — renders red border + red-tinted background */
    error?: boolean;
    /** Accessible error message — linked via aria-describedby (pass the error element's id) */
    "aria-describedby"?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, disabled, ...props }, ref) => {
        return (
            <input
                type={type}
                ref={ref}
                disabled={disabled}
                className={cn(
                    /* Base — spec Section 5.6 */
                    "flex h-10 w-full px-3",
                    "rounded-[var(--radius-md)]",
                    "border border-[var(--color-border)]",
                    "bg-[var(--color-surface)]",
                    "text-[length:var(--text-body)] text-[var(--color-text-high)]",
                    "placeholder:text-[var(--color-text-low)]",
                    "font-[400] font-[var(--font-sans)]",

                    /* Focus — 2px solid primary, 2px offset, no shadow */
                    "focus-visible:outline-none",
                    "focus-visible:border-[var(--color-border-focus)]",
                    "focus-visible:ring-2 focus-visible:ring-[var(--color-action-primary)] focus-visible:ring-offset-2",

                    /* Error state */
                    error && [
                        "border-[var(--color-danger)]",
                        "bg-[var(--color-danger-surface)]",
                        "focus-visible:ring-[var(--color-danger)]",
                    ],

                    /* Disabled */
                    "disabled:bg-[#F3F4F6] disabled:text-[var(--color-text-low)]",
                    "disabled:cursor-not-allowed disabled:opacity-100",

                    /* File input reset */
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium",

                    className
                )}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
