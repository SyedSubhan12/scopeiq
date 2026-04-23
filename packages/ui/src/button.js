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
    primary: [
        "bg-[var(--btn-primary-bg)] text-white",
        "hover:bg-[var(--btn-primary-bg-hover)]",
        "active:bg-[var(--btn-primary-bg-press)]",
        "shadow-[var(--shadow-sm)]",
        "focus-visible:ring-[var(--color-action-primary)]",
    ].join(" "),
    secondary: [
        "border border-[var(--color-action-primary)] text-[var(--color-action-primary)] bg-[var(--color-surface)]",
        "hover:bg-[var(--color-action-subtle)]",
        "focus-visible:ring-[var(--color-action-primary)]",
    ].join(" "),
    danger: [
        "bg-[var(--color-danger)] text-white",
        "hover:opacity-90",
        "active:opacity-100 active:brightness-90",
        "focus-visible:ring-[var(--color-danger)]",
    ].join(" "),
    ghost: [
        "text-[var(--color-text-mid)] bg-transparent",
        "hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-high)]",
        "focus-visible:ring-[var(--color-action-primary)]",
    ].join(" "),
};
/** sm: 32px, md: 40px, lg: 48px — matches spec table */
const sizeStyles = {
    sm: "h-8 px-3 text-[12px] font-[500] gap-1.5",
    md: "h-10 px-4 text-[14px] font-[500] gap-2",
    lg: "h-12 px-6 text-[16px] font-[500] gap-2",
};
const iconSizeMap = {
    sm: "h-[14px] w-[14px]",
    md: "h-[16px] w-[16px]",
    lg: "h-[18px] w-[18px]",
};
exports.Button = React.forwardRef(({ className, variant = "primary", size = "md", loading = false, icon, iconRight, fullWidth = false, disabled, disabledReason, iconOnly, children, type = "button", /* AP-003: never default to submit */ onClick, ...props }, ref) => {
    const isDisabled = disabled || loading;
    /* Ripple effect — only on enabled pointer interactions */
    const handleClick = React.useCallback((e) => {
        if (isDisabled)
            return;
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;
        const ripple = document.createElement("span");
        ripple.className = "btn-ripple";
        ripple.style.cssText = `width:${diameter}px;height:${diameter}px;left:${e.clientX - rect.left - radius}px;top:${e.clientY - rect.top - radius}px`;
        const existing = btn.querySelector(".btn-ripple");
        if (existing)
            existing.remove();
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
        onClick?.(e);
    }, [isDisabled, onClick]);
    const iconSizeCls = iconSizeMap[size ?? "md"];
    return ((0, jsx_runtime_1.jsx)("button", { ref: ref, type: type, className: (0, utils_js_1.cn)("relative overflow-hidden inline-flex items-center justify-center rounded-[var(--radius-lg)]", "transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2", "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none", "active:scale-[0.97]", variantStyles[variant], sizeStyles[size], iconOnly && "px-0 aspect-square", fullWidth && "w-full", className), disabled: isDisabled, onClick: handleClick, "aria-busy": loading ? "true" : undefined, "aria-label": loading ? "Loading…" : undefined, 
        /* Disabled reason — visible on hover/focus — WCAG 1.4.3 */
        title: disabled && disabledReason ? disabledReason : undefined, ...props, children: loading ? ((0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: (0, utils_js_1.cn)("animate-spin shrink-0", iconSizeCls), "aria-hidden": "true" })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [icon && ((0, jsx_runtime_1.jsx)("span", { className: (0, utils_js_1.cn)("shrink-0", iconSizeCls), "aria-hidden": "true", children: icon })), children, iconRight && ((0, jsx_runtime_1.jsx)("span", { className: (0, utils_js_1.cn)("shrink-0", iconSizeCls), "aria-hidden": "true", children: iconRight }))] })) }));
});
exports.Button.displayName = "Button";
/* Ripple keyframe — injected once via singleton style tag */
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
        background: rgba(255,255,255,0.28);
        transform: scale(0);
        animation: btnRipple 0.6s linear forwards;
        pointer-events: none;
      }
    `;
        document.head.appendChild(style);
    }
}
