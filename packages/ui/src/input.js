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
exports.Input = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const utils_js_1 = require("./utils.js");
exports.Input = React.forwardRef(({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [label && ((0, jsx_runtime_1.jsx)("label", { htmlFor: inputId, className: "block text-sm font-medium text-[rgb(var(--text-primary))]", children: label })), (0, jsx_runtime_1.jsx)("input", { ref: ref, id: inputId, className: (0, utils_js_1.cn)("w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors", "border-[rgb(var(--border-default))] bg-white", "placeholder:text-[rgb(var(--text-muted))]", "focus:border-primary focus:ring-2 focus:ring-primary/20", "disabled:cursor-not-allowed disabled:opacity-50", error && "border-status-red focus:border-status-red focus:ring-status-red/20", className), ...props }), error && (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-status-red", children: error }), helperText && !error && ((0, jsx_runtime_1.jsx)("p", { className: "text-xs text-[rgb(var(--text-muted))]", children: helperText }))] }));
});
exports.Input.displayName = "Input";
