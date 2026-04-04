import * as React from "react";
import { cn } from "./utils.js";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[rgb(var(--text-primary))]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors min-h-[80px] resize-y",
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
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
