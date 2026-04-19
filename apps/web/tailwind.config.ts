import type { Config } from "tailwindcss";
import sharedConfig from "../../packages/ui/tailwind.config";

const config: Config = {
    ...sharedConfig,
    darkMode: ["class"],
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        ...sharedConfig.theme,
        extend: {
            ...sharedConfig.theme?.extend,
            boxShadow: {
                'xs': 'var(--shadow-xs)',
                'sm': 'var(--shadow-sm)',
                'md': 'var(--shadow-md)',
                'lg': 'var(--shadow-lg)',
                'xl': 'var(--shadow-xl)',
                'glow': 'var(--shadow-glow)',
            },
            borderRadius: {
                ...((sharedConfig.theme?.extend as Record<string, unknown>)?.borderRadius as Record<string, string> | undefined),
                'xs': 'var(--radius-xs, 2px)',
                'sm': 'var(--radius-sm, 4px)',
                'md': 'var(--radius-md, 6px)',
                'lg': 'var(--radius-lg, 8px)',
                'xl': 'var(--radius-xl, 12px)',
                '2xl': 'var(--radius-2xl, 16px)',
                '3xl': 'var(--radius-3xl, 24px)',
                'full': 'var(--radius-full, 9999px)',
            },
            transitionDuration: {
                'fast': 'var(--duration-fast, 150ms)',
                'normal': 'var(--duration-normal, 250ms)',
                'slow': 'var(--duration-slow, 350ms)',
                'slower': 'var(--duration-slower, 500ms)',
            },
            zIndex: {
                'dropdown': '200',
                'sticky': '300',
                'fixed': '400',
                'modal': '500',
                'popover': '600',
                'tooltip': '700',
            },
        },
    },
};

export default config;
