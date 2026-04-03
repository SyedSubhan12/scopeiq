import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
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
        },
    },
    plugins: [],
};

export default config;
