"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

/**
 * Label — Level 1 Primitive
 *
 * Design System v1.0 spec Section 5.6:
 * - 14px / 600 weight / #0D1B2A
 * - Required fields: label text + " *" in --color-danger, aria-required on the input
 * - margin-bottom: 6px (handled by form layout — not forced here)
 * ⚠ Never use placeholder as substitute for Label — AP (Section 5.6)
 */

interface LabelProps
    extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
    /** When true, appends a red asterisk to indicate required field */
    required?: boolean;
}

const Label = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    LabelProps
>(({ className, required, children, ...props }, ref) => (
    <LabelPrimitive.Root
        ref={ref}
        className={cn(
            "text-[14px] font-[600] text-[var(--color-text-high)]",
            "leading-none",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            className
        )}
        {...props}
    >
        {children}
        {required && (
            <span
                className="ml-0.5 text-[var(--color-danger)]"
                aria-hidden="true"
            >
                {" *"}
            </span>
        )}
    </LabelPrimitive.Root>
))
Label.displayName = "Label"

export { Label }
