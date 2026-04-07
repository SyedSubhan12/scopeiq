import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            // Enhanced responsive breakpoints
            screens: {
                sm: "640px",
                md: "768px",
                lg: "1024px",
                xl: "1280px",
                "2xl": "1536px",
                "3xl": "1920px",
            },
            colors: {
                primary: {
                    DEFAULT: "rgb(var(--primary) / <alpha-value>)",
                    mid: "rgb(var(--primary-mid) / <alpha-value>)",
                    light: "rgb(var(--primary-light) / <alpha-value>)",
                    dark: "rgb(var(--primary-dark) / <alpha-value>)",
                },
                status: {
                    red: "rgb(var(--status-red) / <alpha-value>)",
                    amber: "rgb(var(--status-amber) / <alpha-value>)",
                    green: "rgb(var(--status-green) / <alpha-value>)",
                    blue: "rgb(var(--status-blue) / <alpha-value>)",
                },
            },
            fontFamily: {
                sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
                mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
                serif: ["var(--font-serif)", "Lora", "Georgia", "serif"],
            },
            fontSize: {
                // Fluid typography scale — maps to CSS variables
                xs:   ["var(--text-xs)",   { lineHeight: "var(--leading-none)",    letterSpacing: "var(--tracking-wide)" }],
                sm:   ["var(--text-sm)",   { lineHeight: "var(--leading-normal)" }],
                base: ["var(--text-base)", { lineHeight: "var(--leading-relaxed)" }],
                lg:   ["var(--text-lg)",   { lineHeight: "var(--leading-relaxed)" }],
                xl:   ["var(--text-xl)",   { lineHeight: "var(--leading-tight)",   letterSpacing: "var(--tracking-tight)" }],
                "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-tight)",   letterSpacing: "var(--tracking-tight)" }],
                "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-tight)",   letterSpacing: "var(--tracking-tight)" }],
                "4xl": ["var(--text-4xl)", { lineHeight: "var(--leading-tight)",   letterSpacing: "var(--tracking-tight)" }],
                "5xl": ["var(--text-5xl)", { lineHeight: "var(--leading-tight)",   letterSpacing: "var(--tracking-tight)" }],
            },
            lineHeight: {
                none:     "var(--leading-none)",
                tight:    "var(--leading-tight)",
                snug:     "var(--leading-snug)",
                normal:   "var(--leading-normal)",
                relaxed:  "var(--leading-relaxed)",
                loose:    "var(--leading-loose)",
            },
            letterSpacing: {
                tight:   "var(--tracking-tight)",
                normal:  "var(--tracking-normal)",
                wide:    "var(--tracking-wide)",
                wider:   "var(--tracking-wider)",
                widest:  "var(--tracking-widest)",
            },
            fontWeight: {
                normal:   "var(--font-normal)",
                medium:   "var(--font-medium)",
                semibold: "var(--font-semibold)",
                bold:     "var(--font-bold)",
            },
            borderRadius: {
                DEFAULT: "8px",
                lg: "12px",
            },
            spacing: {
                18: "4.5rem",
                88: "22rem",
            },
            maxWidth: {
                "8xl": "88rem",
                "9xl": "96rem",
            },
            aspectRatio: {
                "portrait": "3 / 4",
                "landscape": "4 / 3",
                "ultrawide": "21 / 9",
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
