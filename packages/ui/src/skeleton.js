"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skeleton = Skeleton;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_js_1 = require("./utils.js");
function Skeleton({ className }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("animate-pulse rounded-md bg-[rgb(var(--border-subtle))]", className) }));
}
