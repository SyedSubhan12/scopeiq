"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Avatar = Avatar;
exports.AvatarGroup = AvatarGroup;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_js_1 = require("./utils.js");
/* -----------------------------------------------------------------------
   Avatar sizes
   ----------------------------------------------------------------------- */
const sizeMap = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl",
};
function getInitials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}
function Avatar({ src, name, size = "md", online, className, }) {
    const base = (0, utils_js_1.cn)("relative inline-flex shrink-0 items-center justify-center rounded-full font-medium", sizeMap[size], className);
    const dotSize = size === "xs" || size === "sm"
        ? "h-2 w-2 border"
        : size === "xl"
            ? "h-3.5 w-3.5 border-2"
            : "h-2.5 w-2.5 border-2";
    const inner = src ? ((0, jsx_runtime_1.jsx)("img", { src: src, alt: name, className: "h-full w-full rounded-full object-cover" })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full w-full items-center justify-center rounded-full bg-primary-light font-medium text-primary", children: getInitials(name) }));
    if (online !== undefined) {
        return ((0, jsx_runtime_1.jsxs)("span", { className: base, children: [inner, (0, jsx_runtime_1.jsx)("span", { "aria-label": online ? "Online" : "Offline", className: (0, utils_js_1.cn)("absolute bottom-0 right-0 rounded-full border-white", online ? "bg-[rgb(var(--status-green))]" : "bg-[rgb(var(--border-strong))]", dotSize) })] }));
    }
    return (0, jsx_runtime_1.jsx)("span", { className: base, children: inner });
}
function AvatarGroup({ members, max = 4, size = "sm", className, }) {
    const visible = members.slice(0, max);
    const overflow = members.length - visible.length;
    const ringMap = {
        xs: "ring-1",
        sm: "ring-2",
        md: "ring-2",
        lg: "ring-[3px]",
        xl: "ring-[3px]",
    };
    const negMarginMap = {
        xs: "-ml-1.5",
        sm: "-ml-2",
        md: "-ml-2.5",
        lg: "-ml-3",
        xl: "-ml-4",
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_js_1.cn)("flex items-center", className), role: "group", "aria-label": `${members.length} member${members.length !== 1 ? "s" : ""}`, children: [visible.map((m, i) => ((0, jsx_runtime_1.jsx)("span", { title: m.name, className: (0, utils_js_1.cn)("ring-white", ringMap[size], i > 0 && negMarginMap[size]), style: { zIndex: visible.length - i }, children: (0, jsx_runtime_1.jsx)(Avatar, { src: m.src ?? null, name: m.name, size: size }) }, m.name + i))), overflow > 0 && ((0, jsx_runtime_1.jsxs)("span", { "aria-label": `${overflow} more`, className: (0, utils_js_1.cn)("inline-flex shrink-0 items-center justify-center rounded-full bg-[rgb(var(--surface-raised))] font-semibold text-[rgb(var(--text-secondary))] ring-white", sizeMap[size], ringMap[size], negMarginMap[size]), style: { zIndex: 0 }, children: ["+", overflow > 99 ? "99" : overflow] }))] }));
}
