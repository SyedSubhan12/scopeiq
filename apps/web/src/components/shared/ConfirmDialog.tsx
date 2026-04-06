"use client";

import { useState, useCallback } from "react";
import { Dialog } from "@novabots/ui";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@novabots/ui";

export type ConfirmVariant = "default" | "danger";

interface ConfirmDialogOptions {
  /** Dialog title */
  title: string;
  /** Description explaining the action */
  description: string;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Visual variant — "danger" styles the dialog with red accents */
  variant?: ConfirmVariant;
}

interface ConfirmDialogProps {
  open: boolean;
  options: ConfirmDialogOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation modal for destructive or irreversible actions.
 * Uses @novabots/ui Dialog. Call onConfirm when user confirms.
 */
export function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const {
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
  } = options;

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const isDanger = variant === "danger";

  return (
    <Dialog open={open} onClose={handleCancel}>
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        {isDanger && (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="shrink-0 rounded-md p-1 text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-[rgb(var(--border-subtle))] pt-4">
        <button
          type="button"
          onClick={handleCancel}
          className={cn(
            "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            "border-[rgb(var(--border-default))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-subtle))]",
          )}
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          autoFocus
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
            isDanger
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              : "bg-primary hover:bg-primary/90 focus:ring-primary",
          )}
        >
          {confirmText}
        </button>
      </div>
    </Dialog>
  );
}

/**
 * Helper that returns a promise resolved when the user confirms,
 * rejected when the user cancels. Useful for imperative confirm flows.
 *
 * Usage:
 *   const confirmed = await confirm({ title: "Delete?", description: "..." });
 *   if (confirmed) { ... }
 */
export function useConfirm() {
  const [pending, setPending] = useState<{
    resolve: (value: boolean) => void;
    options: ConfirmDialogOptions;
  } | null>(null);

  const confirm = useCallback(
    (options: ConfirmDialogOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setPending({ resolve, options });
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    if (pending) {
      pending.resolve(true);
      setPending(null);
    }
  }, [pending]);

  const handleCancel = useCallback(() => {
    if (pending) {
      pending.resolve(false);
      setPending(null);
    }
  }, [pending]);

  const dialog = pending ? (
    <ConfirmDialog
      open={true}
      options={pending.options}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, dialog };
}
