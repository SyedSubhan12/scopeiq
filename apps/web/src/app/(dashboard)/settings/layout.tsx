"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@novabots/ui";
import { Building, Users, CreditCard, Bell, Palette } from "lucide-react";

const NAV = [
    { href: "/settings", label: "General", icon: Building },
    { href: "/settings/workspace", label: "Workspace", icon: Palette },
    { href: "/settings/team", label: "Team", icon: Users },
    { href: "/settings/rate-card", label: "Rate Card", icon: CreditCard },
    { href: "/settings/reminders", label: "Reminders", icon: Bell },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            {/* Sidebar nav */}
            <nav className="shrink-0 pt-1 lg:w-40">
                <ul className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-0.5">
                    {NAV.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className={cn(
                                        "flex min-w-max items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        active
                                            ? "bg-primary/10 text-primary"
                                            : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]",
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Page content */}
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}
