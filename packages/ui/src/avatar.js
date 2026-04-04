"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Avatar = Avatar;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_js_1 = require("./utils.js");
const sizeMap = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
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
function Avatar({ src, name, size = "md", className }) {
    if (src) {
        return ((0, jsx_runtime_1.jsx)("img", { src: src, alt: name, className: (0, utils_js_1.cn)("rounded-full object-cover", sizeMap[size], className) }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("flex items-center justify-center rounded-full bg-primary-light font-medium text-primary", sizeMap[size], className), children: getInitials(name) }));
}
