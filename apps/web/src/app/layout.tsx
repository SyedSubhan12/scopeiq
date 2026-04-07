import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
    fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
    fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
    title: "ScopeIQ",
    description: "B2B SaaS platform for creative agencies",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
            <body className="antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
