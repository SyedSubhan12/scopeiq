"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heading = Heading;
exports.H1 = H1;
exports.H2 = H2;
exports.H3 = H3;
exports.H4 = H4;
exports.Body = Body;
exports.Label = Label;
exports.Caption = Caption;
exports.Stat = Stat;
exports.Code = Code;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("./utils");
const headingClasses = {
    display: "text-5xl font-bold leading-tight tracking-tight",
    h1: "text-4xl font-bold leading-tight tracking-tight",
    h2: "text-3xl font-semibold leading-tight tracking-tight",
    h3: "text-2xl font-semibold leading-tight tracking-tight",
    h4: "text-xl font-semibold leading-tight",
    h5: "text-lg font-semibold leading-tight",
    h6: "text-base font-semibold leading-tight",
};
const colorClasses = {
    primary: "text-[rgb(var(--text-primary))]",
    secondary: "text-[rgb(var(--text-secondary))]",
    muted: "text-[rgb(var(--text-muted))]",
    inherit: "text-inherit",
};
const variantToElement = {
    display: "h1",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
};
function Heading({ as, variant = "h3", color = "primary", className, children, ...props }) {
    const Component = (as ?? variantToElement[variant]);
    return ((0, jsx_runtime_1.jsx)(Component, { className: (0, utils_1.cn)(headingClasses[variant], colorClasses[color], className), ...props, children: children }));
}
function H1(props) {
    return (0, jsx_runtime_1.jsx)(Heading, { as: "h1", variant: "h1", ...props });
}
function H2(props) {
    return (0, jsx_runtime_1.jsx)(Heading, { as: "h2", variant: "h2", ...props });
}
function H3(props) {
    return (0, jsx_runtime_1.jsx)(Heading, { as: "h3", variant: "h3", ...props });
}
function H4(props) {
    return (0, jsx_runtime_1.jsx)(Heading, { as: "h4", variant: "h4", ...props });
}
const bodySizeClasses = {
    lg: "text-lg leading-relaxed",
    base: "text-base leading-relaxed",
    sm: "text-sm leading-normal",
    xs: "text-xs leading-normal",
};
const bodyWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
};
function Body({ size = "base", color = "primary", weight = "normal", className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("p", { className: (0, utils_1.cn)(bodySizeClasses[size], bodyWeightClasses[weight], colorClasses[color], className), ...props, children: children }));
}
const labelSizeClasses = {
    sm: "text-xs tracking-wide",
    base: "text-xs tracking-wider",
    lg: "text-sm tracking-widest",
};
const labelWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
};
function Label({ size = "base", color = "muted", weight = "medium", className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("uppercase leading-none", labelSizeClasses[size], labelWeightClasses[weight], colorClasses[color], className), ...props, children: children }));
}
const captionColorClasses = {
    muted: "text-[rgb(var(--text-muted))]",
    secondary: "text-[rgb(var(--text-secondary))]",
};
function Caption({ color = "muted", className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("p", { className: (0, utils_1.cn)("text-xs leading-normal", captionColorClasses[color], className), ...props, children: children }));
}
const statSizeClasses = {
    base: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
};
function Stat({ size = "base", color = "primary", className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("font-bold leading-none tabular-nums", statSizeClasses[size], colorClasses[color], className), ...props, children: children }));
}
function Code({ color = "primary", className, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("code", { className: (0, utils_1.cn)("font-mono text-xs leading-normal", colorClasses[color], className), ...props, children: children }));
}
