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
exports.DropdownMenu = DropdownMenu;
exports.DropdownItem = DropdownItem;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const utils_js_1 = require("./utils.js");
function DropdownMenu({ trigger, children, align = "right" }) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);
    React.useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { ref: ref, className: "relative inline-block", children: [(0, jsx_runtime_1.jsx)("div", { onClick: () => setOpen(!open), children: trigger }), open && ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_js_1.cn)("absolute top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[rgb(var(--border-default))] bg-white py-1 shadow-lg", align === "right" ? "right-0" : "left-0"), children: children }))] }));
}
function DropdownItem({ className, destructive, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("button", { className: (0, utils_js_1.cn)("flex w-full items-center px-3 py-2 text-sm transition-colors", destructive
            ? "text-status-red hover:bg-red-50"
            : "text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-subtle))]", className), ...props, children: children }));
}
