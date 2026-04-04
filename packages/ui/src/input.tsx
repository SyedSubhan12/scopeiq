import * as React from "react";
import { cn } from "./utils.js";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[rgb(var(--text-primary))]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
            "border-[rgb(var(--border-default))] bg-white",
            "placeholder:text-[rgb(var(--text-muted))]",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-status-red focus:border-status-red focus:ring-status-red/20",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-status-red">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-[rgb(var(--text-muted))]">{helperText}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
