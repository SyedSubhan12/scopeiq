import type { Config } from "tailwindcss";

/**
 * Tailwind config — ScopeIQ Design System v1.0
 * Colors alias semantic CSS custom properties from globals.css.
 * Never reference raw hex in components — use these aliases or direct var() refs.
 */
const config: Config = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            screens: {
                sm: "640px",
                md: "768px",
                lg: "1024px",
                xl: "1280px",
                "2xl": "1536px",
                "3xl": "1920px",
            },
            colors: {
                /* Tier 2 — Semantic token aliases */
                action: {
                    primary: "var(--color-action-primary)",
                    hover: "var(--color-action-hover)",
                    press: "var(--color-action-press)",
                    subtle: "var(--color-action-subtle)",
                },
                status: {
                    danger: "var(--color-danger)",
                    warning: "var(--color-warning)",
                    "warning-text": "var(--color-warning-text)",
                    success: "var(--color-success)",
                    info: "var(--color-info)",
                    "info-text": "var(--color-info-text)",
                },
                surface: {
                    DEFAULT: "var(--color-surface)",
                    raised: "var(--color-surface-raised)",
                },
                text: {
                    high: "var(--color-text-high)",
                    mid: "var(--color-text-mid)",
                    low: "var(--color-text-low)",
                },
                border: {
                    DEFAULT: "var(--color-border)",
                    focus: "var(--color-border-focus)",
                },

                /* Legacy aliases — kept for existing component compat */
                primary: {
                    DEFAULT: "var(--color-action-primary)",
                    hover: "var(--color-action-hover)",
                    press: "var(--color-action-press)",
                    light: "var(--color-action-subtle)",
                    dark: "var(--color-action-press)",
                    mid: "var(--color-action-hover)",
                },
            },
            fontFamily: {
                sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
                mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
            },
            fontSize: {
                display: ["var(--text-display)", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
                h1: ["var(--text-h1)", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
                h2: ["var(--text-h2)", { lineHeight: "1.35" }],
                h3: ["var(--text-h3)", { lineHeight: "1.4" }],
                "body-lg": ["var(--text-body-lg)", { lineHeight: "1.6" }],
                body: ["var(--text-body)", { lineHeight: "1.5" }],
                sm: ["var(--text-sm)", { lineHeight: "1.4" }],
                code: ["var(--text-code)", { lineHeight: "1.5" }],
                label: ["var(--text-label)", { lineHeight: "1", letterSpacing: "0.05em" }],
            },
            spacing: {
                1: "var(--space-1)",
                2: "var(--space-2)",
                3: "var(--space-3)",
                4: "var(--space-4)",
                5: "var(--space-5)",
                6: "var(--space-6)",
                8: "var(--space-8)",
                10: "var(--space-10)",
                12: "var(--space-12)",
                16: "var(--space-16)",
                /* Non-overriding additions */
                18: "4.5rem",
                88: "22rem",
            },
            borderRadius: {
                sm: "var(--radius-sm)",
                md: "var(--radius-md)",
                DEFAULT: "var(--radius-lg)",
                lg: "var(--radius-lg)",
                xl: "var(--radius-xl)",
                full: "var(--radius-full)",
            },
            boxShadow: {
                sm: "var(--shadow-sm)",
                md: "var(--shadow-md)",
                lg: "var(--shadow-lg)",
                xl: "var(--shadow-xl)",
            },
            zIndex: {
                base: "var(--z-base)",
                raised: "var(--z-raised)",
                sticky: "var(--z-sticky)",
                overlay: "var(--z-overlay)",
                dropdown: "var(--z-dropdown)",
                modal: "var(--z-modal)",
                toast: "var(--z-toast)",
                nav: "var(--z-nav)",
            },
            maxWidth: {
                "8xl": "88rem",
                "9xl": "96rem",
            },
            keyframes: {
                shimmer: {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(100%)" },
                },
            },
            animation: {
                shimmer: "shimmer 1.5s infinite",
            },
        },
    },
    plugins: [],
};

export default config;
