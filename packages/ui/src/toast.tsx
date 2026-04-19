"use client";

import * as React from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "./utils.js";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: WarningIcon,
} as const;

const toastStyles: Record<ToastType, { wrapper: string; icon: string; progress: string }> = {
  success: {
    wrapper:
      "border-[rgb(var(--status-green))] bg-white",
    icon: "text-[rgb(var(--status-green))]",
    progress: "bg-[rgb(var(--status-green))]",
  },
  error: {
    wrapper:
      "border-[rgb(var(--status-red))] bg-white",
    icon: "text-[rgb(var(--status-red))]",
    progress: "bg-[rgb(var(--status-red))]",
  },
  info: {
    wrapper:
      "border-[rgb(var(--status-blue))] bg-white",
    icon: "text-[rgb(var(--status-blue))]",
    progress: "bg-[rgb(var(--status-blue))]",
  },
  warning: {
    wrapper:
      "border-[rgb(var(--status-amber))] bg-white",
    icon: "text-[rgb(var(--status-amber))]",
    progress: "bg-[rgb(var(--status-amber))]",
  },
};

/* Inject toast animation styles once */
const TOAST_STYLE_ID = "ui-toast-styles";
if (typeof document !== "undefined" && !document.getElementById(TOAST_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = TOAST_STYLE_ID;
  style.textContent = `
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(calc(100% + 1rem)); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateX(0); max-height: 5rem; margin-bottom: 0.5rem; }
      to   { opacity: 0; transform: translateX(calc(100% + 1rem)); max-height: 0; margin-bottom: 0; }
    }
    @keyframes toastProgress {
      from { width: 100%; }
      to   { width: 0%; }
    }
    .toast-enter { animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
    .toast-exit  { animation: toastOut 0.25s ease-in both; }
    .toast-progress-bar { animation: toastProgress linear both; }
  `;
  document.head.appendChild(style);
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [exiting, setExiting] = React.useState(false);
  const style = toastStyles[toast.type];
  const Icon = icons[toast.type];

  const dismiss = React.useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 250);
  }, [toast.id, onRemove]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        "relative overflow-hidden flex items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-lg)] text-sm min-w-[280px] max-w-sm",
        style.wrapper,
        exiting ? "toast-exit" : "toast-enter",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", style.icon)} />
      <span className="flex-1 text-[rgb(var(--text-primary))] leading-relaxed">{toast.message}</span>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-md p-0.5 opacity-50 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/50"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5 text-[rgb(var(--text-primary))]" aria-hidden />
      </button>
      {/* Progress bar */}
      <div
        className={cn("absolute bottom-0 left-0 h-0.5 toast-progress-bar", style.progress)}
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration + 300); // +300 for exit animation
    },
    [],
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[var(--z-tooltip,700)] flex flex-col gap-2 pointer-events-none"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
