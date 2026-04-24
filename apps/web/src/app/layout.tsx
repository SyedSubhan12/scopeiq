import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { Inter, JetBrains_Mono, Sora, DM_Sans, Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-alt",
    display: "swap",
    fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
    fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

const sora = Sora({
    subsets: ["latin"],
    weight: ["600", "700", "800"],
    variable: "--font-display",
    display: "swap",
});

const dmSans = DM_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-body",
    display: "swap",
});

const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-serif",
    display: "swap",
    axes: ["opsz", "SOFT"],
});

const ibmPlex = IBM_Plex_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
    variable: "--font-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: "ScopeIQ — AI-Powered Scope Enforcement for Creative Agencies",
    description:
        "Stop losing revenue to scope creep. ScopeIQ catches vague briefs, automates client approvals, and flags out-of-scope requests in under 5 seconds.",
    keywords: [
        "scope creep",
        "creative agency software",
        "client approval portal",
        "brief management",
        "change order generator",
        "AI for agencies",
    ],
    authors: [{ name: "Novabots" }],
    openGraph: {
        title: "ScopeIQ — Stop Losing Revenue to Scope Creep",
        description: "79% of agencies over-service clients. ScopeIQ fixes that.",
        url: "https://scopeiq.com",
        siteName: "ScopeIQ by Novabots",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "ScopeIQ — AI-Powered Scope Enforcement",
        description: "Brief scoring, approval portals, real-time scope monitoring.",
    },
    robots: { index: true, follow: true },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${sora.variable} ${dmSans.variable} ${fraunces.variable} ${ibmPlex.variable} font-sans antialiased`} suppressHydrationWarning>
            <body className="antialiased" suppressHydrationWarning>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
