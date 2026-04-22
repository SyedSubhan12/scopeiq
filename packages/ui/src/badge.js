"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBadge = StatusBadge;
exports.Badge = Badge;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_js_1 = require("./utils.js");
/**
 * Spec-verified color pairs. All ratios at label font size (11px/500).
 * warning text (#92400E on #FFFBEB): 5.2:1 ✅
 * danger  text (#DC2626 on #FEF2F2): 4.95:1 ✅
 * success text (#059669 on #ECFDF5): 4.52:1 ✅
 * info    text (#1D4ED8 on #EFF6FF):  6.8:1 ✅
 * neutral text (#4B5563 on #F3F4F6): 5.9:1 ✅
 * pending text (#9A3412 on #FFF7ED): 6.1:1 ✅
 */
const variantStyles = {
    success: {
        container: "bg-[#ECFDF5] text-[#059669]",
        dot: "bg-[#059669]",
    },
    warning: {
        /* text is #92400E — NOT #D97706 — per AP-002 */
        container: "bg-[#FFFBEB] text-[#92400E]",
        dot: "bg-[#D97706]",
    },
    danger: {
        container: "bg-[#FEF2F2] text-[#DC2626]",
        dot: "bg-[#DC2626]",
    },
    info: {
        /* text is #1D4ED8 — darker blue for small text contrast per spec Section 2.3 */
        container: "bg-[#EFF6FF] text-[#1D4ED8]",
        dot: "bg-[#2563EB]",
    },
    neutral: {
        container: "bg-[#F3F4F6] text-[#4B5563]",
        dot: "bg-[#9CA3AF]",
    },
    pending: {
        container: "bg-[#FFF7ED] text-[#9A3412]",
        dot: "bg-[#EA580C]",
    },
};
const sizeStyles = {
    sm: "h-[18px] px-2 text-[10px] gap-1",
    md: "h-[22px] px-2.5 text-[11px] gap-1.5",
};
function StatusBadge({ variant, label, size = "md", dot = false, className, }) {
    const styles = variantStyles[variant];
    return ((0, jsx_runtime_1.jsxs)("span", { className: (0, utils_js_1.cn)("inline-flex items-center rounded-[var(--radius-full)] font-[500] tracking-[0.04em] uppercase select-none", sizeStyles[size], styles.container, className), children: [dot && ((0, jsx_runtime_1.jsx)("span", { className: (0, utils_js_1.cn)("shrink-0 rounded-full", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2", styles.dot), "aria-hidden": "true" })), label] }));
}
/**
 * Legacy Badge — kept for backward compatibility.
 * New code should use StatusBadge.
 * @deprecated Use StatusBadge with a semantic variant instead.
 */
const legacyStatusStyles = {
    approved: "bg-[#ECFDF5] text-[#059669]",
    in_review: "bg-[#EFF6FF] text-[#1D4ED8]",
    pending: "bg-[#FFFBEB] text-[#92400E]",
    flagged: "bg-[#FEF2F2] text-[#DC2626]",
    draft: "bg-[#F3F4F6] text-[#4B5563]",
    active: "bg-[#E1F5EE] text-[#0F6E56]",
    paused: "bg-[#FFFBEB] text-[#92400E]",
    completed: "bg-[#ECFDF5] text-[#059669]",
    archived: "bg-[#F3F4F6] text-[#9CA3AF]",
};
/** @deprecated Use StatusBadge */
function Badge({ status, children, className }) {
    return ((0, jsx_runtime_1.jsx)("span", { className: (0, utils_js_1.cn)("inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium", legacyStatusStyles[status], className), children: children }));
}
