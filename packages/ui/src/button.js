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
exports.Button = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const utils_js_1 = require("./utils.js");
const variantStyles = {
    primary: "bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-dark))] shadow-sm hover:shadow-[0_4px_12px_rgba(15,110,86,0.3)] hover:-translate-y-px",
    secondary: "border border-[rgb(var(--primary))] text-[rgb(var(--primary))] bg-white hover:bg-[rgb(var(--primary-light))] hover:-translate-y-px",
    danger: "bg-[rgb(var(--status-red))] text-white hover:bg-[#dc2626] hover:shadow-[0_4px_12px_rgba(220,38,38,0.3)] hover:-translate-y-px",
    ghost: "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]",
    success: "bg-[rgb(var(--status-green))] text-white hover:bg-[#059669] hover:shadow-[0_4px_12px_rgba(5,150,105,0.3)] hover:-translate-y-px shadow-sm",
    warning: "bg-[rgb(var(--status-amber))] text-white hover:opacity-90 shadow-sm",
};
const sizeStyles = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base font-semibold gap-2",
    xl: "h-14 px-8 text-lg font-semibold gap-2.5",
};
exports.Button = React.forwardRef(({ className, variant = "primary", size = "md", loading, iconOnly, children, disabled, onClick, ...props }, ref) => {
    const handleClick = React.useCallback((e) => {
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
        if (existing)
            existing.remove();
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
        onClick?.(e);
    }, [onClick]);
    const iconSizeStyles = {
        sm: "w-8 px-0",
        md: "w-10 px-0",
        lg: "w-12 px-0",
        xl: "w-14 px-0",
    };
    return ((0, jsx_runtime_1.jsxs)("button", { ref: ref, className: (0, utils_js_1.cn)("relative overflow-hidden inline-flex items-center justify-center rounded-lg font-medium", "transition-all duration-[150ms] ease-out", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/50 focus-visible:ring-offset-2", "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none", "active:scale-[0.97]", variantStyles[variant], sizeStyles[size], iconOnly && iconSizeStyles[size], className), disabled: disabled || loading, onClick: handleClick, ...props, children: [loading ? ((0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "h-4 w-4 animate-spin shrink-0", "aria-hidden": true })) : null, children] }));
});
exports.Button.displayName = "Button";
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
