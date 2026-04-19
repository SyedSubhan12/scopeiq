"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
exports.CardHeader = CardHeader;
exports.CardTitle = CardTitle;
exports.CardBody = CardBody;
exports.CardContent = CardContent;
exports.CardFooter = CardFooter;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_js_1 = require("./utils.js");
const elevationStyles = {
    none: "",
    sm: "shadow-[var(--shadow-sm)]",
    md: "shadow-[var(--shadow-md)]",
    lg: "shadow-[var(--shadow-lg)]",
};
const elevationHoverStyles = {
    none: "",
    sm: "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
    md: "hover:shadow-[var(--shadow-lg)] hover:-translate-y-1",
    lg: "hover:shadow-[var(--shadow-xl)] hover:-translate-y-1",
};
function Card({ className, hoverable, elevation = "none", accent = false, isLoading = false, children, ...props }) {
    if (isLoading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("rounded-lg border border-[rgb(var(--border-subtle))] bg-white p-4", className), "aria-busy": "true", "aria-label": "Loading", ...props, children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "skeleton-shimmer h-4 w-2/3" }), (0, jsx_runtime_1.jsx)("div", { className: "skeleton-shimmer h-3 w-full" }), (0, jsx_runtime_1.jsx)("div", { className: "skeleton-shimmer h-3 w-4/5" }), (0, jsx_runtime_1.jsx)("div", { className: "skeleton-shimmer h-3 w-1/2" })] }) }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("rounded-lg border border-[rgb(var(--border-subtle))] bg-white", "transition-all duration-[200ms] ease-out", hoverable && "cursor-pointer", elevation !== "none" && elevationStyles[elevation], elevation !== "none" && elevationHoverStyles[elevation], hoverable && elevation === "none" && "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5", accent && "border-l-[3px] border-l-[rgb(var(--primary))]", className), ...props, children: children }));
}
function CardHeader({ className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("flex items-center justify-between border-b border-[rgb(var(--border-subtle))] px-5 py-4", className), ...props, children: children }));
}
function CardTitle({ className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("h3", { className: (0, utils_js_1.cn)("text-base font-semibold text-[rgb(var(--text-primary))]", className), ...props, children: children }));
}
function CardBody({ className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("px-5 py-4 text-sm text-[rgb(var(--text-secondary))]", className), ...props, children: children }));
}
function CardContent({ className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("p-4 text-sm text-[rgb(var(--text-secondary))]", className), ...props, children: children }));
}
function CardFooter({ className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("flex items-center border-t border-[rgb(var(--border-subtle))] px-5 py-3", className), ...props, children: children }));
}
