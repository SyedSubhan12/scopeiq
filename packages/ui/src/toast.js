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
const icons = {
    success: lucide_react_1.CheckCircle,
    error: lucide_react_1.AlertCircle,
    info: lucide_react_1.Info,
};
const styles = {
    success: "border-status-green bg-green-50 text-green-800",
    error: "border-status-red bg-red-50 text-red-800",
    info: "border-status-blue bg-blue-50 text-blue-800",
};
function ToastProvider({ children }) {
    const [toasts, setToasts] = React.useState([]);
    const addToast = React.useCallback((type, message) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);
    const removeToast = React.useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    return ((0, jsx_runtime_1.jsxs)(ToastContext.Provider, { value: { toast: addToast }, children: [children, (0, jsx_runtime_1.jsx)("div", { className: "fixed bottom-4 right-4 z-[100] flex flex-col gap-2", children: toasts.map((t) => {
                    const Icon = icons[t.type];
                    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_js_1.cn)("flex items-center gap-2 rounded-lg border px-4 py-3 shadow-md text-sm animate-in slide-in-from-right", styles[t.type]), children: [(0, jsx_runtime_1.jsx)(Icon, { className: "h-4 w-4 shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "flex-1", children: t.message }), (0, jsx_runtime_1.jsx)("button", { onClick: () => removeToast(t.id), className: "shrink-0 opacity-60 hover:opacity-100", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3.5 w-3.5" }) })] }, t.id));
                }) })] }));
}
