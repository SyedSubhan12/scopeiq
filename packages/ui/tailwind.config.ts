import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            // Enhanced responsive breakpoints
            screens: {
                sm: "640px",    // Mobile landscape
                md: "768px",    // Tablet portrait
                lg: "1024px",   // Tablet landscape / small desktop
                xl: "1280px",   // Desktop
                "2xl": "1536px", // Large desktop
                "3xl": "1920px", // Ultra-wide displays
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
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            borderRadius: {
                DEFAULT: "8px",
                lg: "12px",
            },
            // Enhanced spacing scale
            spacing: {
                18: "4.5rem",
                88: "22rem",
            },
            // Container max-widths for responsive layouts
            maxWidth: {
                "8xl": "88rem",
                "9xl": "96rem",
            },
            // Aspect ratio utilities
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
