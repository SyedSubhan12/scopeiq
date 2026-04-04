"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
exports.CardHeader = CardHeader;
exports.CardTitle = CardTitle;
exports.CardContent = CardContent;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_js_1 = require("./utils.js");
function Card({ className, hoverable, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("rounded-lg border border-[rgb(var(--border-default))] bg-white p-4", hoverable && "transition-shadow hover:shadow-md cursor-pointer", className), ...props, children: children }));
}
function CardHeader({ className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("mb-3", className), ...props, children: children }));
}
function CardTitle({ className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("h3", { className: (0, utils_js_1.cn)("text-base font-semibold text-[rgb(var(--text-primary))]", className), ...props, children: children }));
}
function CardContent({ className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("text-sm text-[rgb(var(--text-secondary))]", className), ...props, children: children }));
}
