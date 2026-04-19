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
exports.MetricCard = MetricCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const utils_js_1 = require("./utils.js");
function MetricCard({ label, value, prefix, suffix, trend, description, className, isLoading = false, }) {
    const [displayValue, setDisplayValue] = React.useState(0);
    React.useEffect(() => {
        if (isLoading)
            return;
        setDisplayValue(0);
        const duration = 600;
        const steps = 30;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            }
            else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [value, isLoading]);
    if (isLoading) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_js_1.cn)("rounded-xl border border-[rgb(var(--border-subtle))] bg-white p-4", className), "aria-busy": "true", "aria-label": "Loading metric", children: [(0, jsx_runtime_1.jsx)("div", { className: "skeleton-shimmer h-3 w-24 mb-3" }), (0, jsx_runtime_1.jsx)("div", { className: "skeleton-shimmer h-8 w-20 mb-2" }), (0, jsx_runtime_1.jsx)("div", { className: "skeleton-shimmer h-3 w-14" })] }));
    }
    const TrendIcon = trend?.direction === "up"
        ? lucide_react_1.TrendingUp
        : trend?.direction === "down"
            ? lucide_react_1.TrendingDown
            : lucide_react_1.Minus;
    const trendColor = trend?.direction === "up"
        ? "text-[rgb(var(--status-green))]"
        : trend?.direction === "down"
            ? "text-[rgb(var(--status-red))]"
            : "text-[rgb(var(--text-muted))]";
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_js_1.cn)("rounded-xl border border-[rgb(var(--border-subtle))] bg-white p-4", "transition-all duration-200 ease-out hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5", className), children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]", children: label }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-1.5 flex items-baseline gap-1.5", children: [prefix ? ((0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-[rgb(var(--text-muted))]", children: prefix })) : null, (0, jsx_runtime_1.jsx)("span", { className: "text-2xl font-bold text-[rgb(var(--text-primary))] tabular-nums", children: displayValue.toLocaleString() }), suffix ? ((0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-[rgb(var(--text-muted))]", children: suffix })) : null, trend ? ((0, jsx_runtime_1.jsxs)("span", { className: (0, utils_js_1.cn)("ml-1 flex items-center gap-0.5 text-xs font-medium", trendColor), children: [(0, jsx_runtime_1.jsx)(TrendIcon, { className: "h-3.5 w-3.5 shrink-0", "aria-hidden": true }), trend.label ?? `${trend.value}%`] })) : null] }), description ? ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-[rgb(var(--text-muted))] leading-relaxed", children: description })) : null] }));
}
