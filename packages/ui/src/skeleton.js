"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skeleton = Skeleton;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_js_1 = require("./utils.js");
function Skeleton({ className, variant = "default", width }) {
    if (variant === "circular") {
        return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("animate-pulse rounded-full bg-[rgb(var(--border-subtle))]", className) }));
    }
    if (variant === "text") {
        return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("relative overflow-hidden rounded-md bg-[rgb(var(--border-subtle))]", "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent", className), style: width ? { width } : undefined }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("animate-pulse rounded-md bg-[rgb(var(--border-subtle))]", className) }));
}
