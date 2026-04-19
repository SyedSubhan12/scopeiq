"use client";
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useToast = useToast;
exports.ToastProvider = ToastProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const utils_js_1 = require("./utils.js");
const ToastContext = React.createContext(null);
function useToast() {
    const ctx = React.useContext(ToastContext);
    if (!ctx)
        throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
function WarningIcon({ className }) {
    return ((0, jsx_runtime_1.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("path", { d: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "9", x2: "12", y2: "13" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })] }));
}
const icons = {
    success: lucide_react_1.CheckCircle,
    error: lucide_react_1.AlertCircle,
    info: lucide_react_1.Info,
    warning: WarningIcon,
};
const toastStyles = {
    success: {
        wrapper: "border-[rgb(var(--status-green))] bg-white",
        icon: "text-[rgb(var(--status-green))]",
        progress: "bg-[rgb(var(--status-green))]",
    },
    error: {
        wrapper: "border-[rgb(var(--status-red))] bg-white",
        icon: "text-[rgb(var(--status-red))]",
        progress: "bg-[rgb(var(--status-red))]",
    },
    info: {
        wrapper: "border-[rgb(var(--status-blue))] bg-white",
        icon: "text-[rgb(var(--status-blue))]",
        progress: "bg-[rgb(var(--status-blue))]",
    },
    warning: {
        wrapper: "border-[rgb(var(--status-amber))] bg-white",
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
function ToastItem({ toast, onRemove, }) {
    const [exiting, setExiting] = React.useState(false);
    const style = toastStyles[toast.type];
    const Icon = icons[toast.type];
    const dismiss = React.useCallback(() => {
        setExiting(true);
        setTimeout(() => onRemove(toast.id), 250);
    }, [toast.id, onRemove]);
    return ((0, jsx_runtime_1.jsxs)("div", { role: "alert", "aria-live": "assertive", "aria-atomic": "true", className: (0, utils_js_1.cn)("relative overflow-hidden flex items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-lg)] text-sm min-w-[280px] max-w-sm", style.wrapper, exiting ? "toast-exit" : "toast-enter"), children: [(0, jsx_runtime_1.jsx)(Icon, { className: (0, utils_js_1.cn)("h-4 w-4 shrink-0 mt-0.5", style.icon) }), (0, jsx_runtime_1.jsx)("span", { className: "flex-1 text-[rgb(var(--text-primary))] leading-relaxed", children: toast.message }), (0, jsx_runtime_1.jsx)("button", { onClick: dismiss, className: "shrink-0 rounded-md p-0.5 opacity-50 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/50", "aria-label": "Dismiss notification", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3.5 w-3.5 text-[rgb(var(--text-primary))]", "aria-hidden": true }) }), (0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("absolute bottom-0 left-0 h-0.5 toast-progress-bar", style.progress), style: { animationDuration: `${toast.duration}ms` } })] }));
}
function ToastProvider({ children }) {
    const [toasts, setToasts] = React.useState([]);
    const addToast = React.useCallback((type, message, duration = 4000) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, type, message, duration }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration + 300); // +300 for exit animation
    }, []);
    const removeToast = React.useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    return ((0, jsx_runtime_1.jsxs)(ToastContext.Provider, { value: { toast: addToast }, children: [children, (0, jsx_runtime_1.jsx)("div", { className: "fixed bottom-4 right-4 z-[var(--z-tooltip,700)] flex flex-col gap-2 pointer-events-none", "aria-label": "Notifications", children: toasts.map((t) => ((0, jsx_runtime_1.jsx)("div", { className: "pointer-events-auto", children: (0, jsx_runtime_1.jsx)(ToastItem, { toast: t, onRemove: removeToast }) }, t.id))) })] }));
}
