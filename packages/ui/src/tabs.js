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
exports.Tabs = Tabs;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const utils_js_1 = require("./utils.js");
/**
 * Pill-style tabs with an animated sliding background indicator.
 * Fully keyboard-navigable (ArrowLeft/Right, Home, End).
 * Supports badge counts and disabled tabs.
 * Mobile-safe: horizontally scrollable tab list.
 */
function Tabs({ items, activeKey: controlledKey, defaultActiveKey, onChange, panels, className, }) {
    const firstKey = items[0]?.key ?? "";
    const [internalKey, setInternalKey] = React.useState(defaultActiveKey ?? firstKey);
    const activeKey = controlledKey ?? internalKey;
    const containerRef = React.useRef(null);
    const tabRefs = React.useRef(new Map());
    const [indicator, setIndicator] = React.useState({ left: 0, width: 0 });
    const [mounted, setMounted] = React.useState(false);
    const measure = React.useCallback(() => {
        const container = containerRef.current;
        const activeBtn = tabRefs.current.get(activeKey);
        if (!container || !activeBtn)
            return;
        const cRect = container.getBoundingClientRect();
        const tRect = activeBtn.getBoundingClientRect();
        setIndicator({ left: tRect.left - cRect.left, width: tRect.width });
    }, [activeKey]);
    React.useEffect(() => {
        measure();
        setMounted(true);
        const ro = new ResizeObserver(measure);
        if (containerRef.current)
            ro.observe(containerRef.current);
        window.addEventListener("resize", measure);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, [measure]);
    function select(key) {
        if (controlledKey === undefined)
            setInternalKey(key);
        onChange?.(key);
    }
    function handleKeyDown(e) {
        const enabled = items.filter((i) => !i.disabled);
        const idx = enabled.findIndex((i) => i.key === activeKey);
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = enabled[(idx + 1) % enabled.length];
            if (next)
                select(next.key);
        }
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const prev = enabled[(idx - 1 + enabled.length) % enabled.length];
            if (prev)
                select(prev.key);
        }
        else if (e.key === "Home") {
            e.preventDefault();
            if (enabled[0])
                select(enabled[0].key);
        }
        else if (e.key === "End") {
            e.preventDefault();
            const last = enabled[enabled.length - 1];
            if (last)
                select(last.key);
        }
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_js_1.cn)("w-full", className), children: [(0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto pb-px", children: (0, jsx_runtime_1.jsxs)("div", { ref: containerRef, role: "tablist", onKeyDown: handleKeyDown, className: "relative inline-flex min-w-full items-center gap-1 rounded-xl bg-[rgb(var(--surface-raised))] p-1", children: [mounted && ((0, jsx_runtime_1.jsx)("div", { "aria-hidden": "true", className: "pointer-events-none absolute top-1 bottom-1 rounded-lg bg-white shadow-[var(--shadow-sm)] border border-[rgb(var(--border-subtle))]", style: {
                                left: indicator.left,
                                width: indicator.width,
                                transition: "left 250ms cubic-bezier(0.34,1.56,0.64,1), width 250ms cubic-bezier(0.34,1.56,0.64,1)",
                            } })), items.map((item) => {
                            const isActive = item.key === activeKey;
                            return ((0, jsx_runtime_1.jsxs)("button", { ref: (el) => {
                                    if (el)
                                        tabRefs.current.set(item.key, el);
                                    else
                                        tabRefs.current.delete(item.key);
                                }, type: "button", role: "tab", id: `tab-${item.key}`, "aria-selected": isActive, "aria-controls": `tabpanel-${item.key}`, tabIndex: isActive ? 0 : -1, disabled: item.disabled, onClick: () => !item.disabled && select(item.key), className: (0, utils_js_1.cn)("relative z-10 inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/50", isActive
                                    ? "text-[rgb(var(--text-primary))]"
                                    : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]", item.disabled && "cursor-not-allowed opacity-40"), children: [(0, jsx_runtime_1.jsx)("span", { children: item.label }), item.badge !== undefined && item.badge > 0 && ((0, jsx_runtime_1.jsx)("span", { className: (0, utils_js_1.cn)("inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-px text-[10px] font-bold leading-none", isActive
                                            ? "bg-[rgb(var(--primary))] text-white"
                                            : "bg-[rgb(var(--surface-overlay))] text-[rgb(var(--text-muted))]"), children: item.badge > 99 ? "99+" : item.badge }))] }, item.key));
                        })] }) }), panels && ((0, jsx_runtime_1.jsx)("div", { className: "mt-4", children: items.map((item) => ((0, jsx_runtime_1.jsx)("div", { id: `tabpanel-${item.key}`, role: "tabpanel", "aria-labelledby": `tab-${item.key}`, hidden: item.key !== activeKey, className: "animate-fadeIn", children: panels[item.key] }, item.key))) }))] }));
}
