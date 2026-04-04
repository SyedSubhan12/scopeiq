"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Select = Select;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const utils_js_1 = require("./utils.js");
function Select({ options, value, onChange, placeholder = "Select...", label, error, disabled, className, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [label && ((0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-[rgb(var(--text-primary))]", children: label })), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsxs)("select", { value: value ?? "", onChange: (e) => onChange?.(e.target.value), disabled: disabled, className: (0, utils_js_1.cn)("w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm outline-none transition-colors", "border-[rgb(var(--border-default))] bg-white", "focus:border-primary focus:ring-2 focus:ring-primary/20", "disabled:cursor-not-allowed disabled:opacity-50", error && "border-status-red", className), children: [(0, jsx_runtime_1.jsx)("option", { value: "", disabled: true, children: placeholder }), options.map((opt) => ((0, jsx_runtime_1.jsx)("option", { value: opt.value, children: opt.label }, opt.value)))] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" })] }), error && (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-status-red", children: error })] }));
}
