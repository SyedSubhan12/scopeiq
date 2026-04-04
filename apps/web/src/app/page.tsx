import Link from "next/link";
import {
    FileText,
    ShieldCheck,
    Layers,
    ArrowRight,
    Star,
    Zap,
} from "lucide-react";
import { HomeNavbar } from "@/components/HomeNavbar";

const features = [
    {
        icon: FileText,
        title: "AI-Scored Brief Builder",
        description:
            "Clients fill a structured brief. Our AI scores it for clarity and flags missing information before your team touches it.",
    },
    {
        icon: ShieldCheck,
        title: "Scope Guard",
        description:
            "Every deliverable is tracked against the original brief. Scope creep is flagged automatically, not discovered in invoice disputes.",
    },
    {
        icon: Layers,
        title: "Client Approval Portal",
        description:
            "Clients review, annotate, and approve deliverables through a branded portal — no login required, no email chains.",
    },
    {
        icon: Zap,
        title: "Change Order Automation",
        description:
            "Out-of-scope work generates a change order with one click. Get sign-off before you start, not after.",
    },
];

const steps = [
    { step: "1", title: "Build your brief template", body: "Create a reusable intake form for your service type. Add fields, mark required ones." },
    { step: "2", title: "Share with your client", body: "Send a link. The client fills the brief — no account needed. AI scores it instantly." },
    { step: "3", title: "Deliver and track approvals", body: "Upload deliverables to a branded portal. Clients annotate and approve with one click." },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            <HomeNavbar />

            {/* Hero */}
            <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F6E56]/20 bg-[#0F6E56]/5 px-3 py-1 text-xs font-medium text-[#0F6E56]">
                    <Star className="h-3 w-3 fill-current" />
                    Built for creative agencies
                </div>

                <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-bold leading-tight tracking-tight text-gray-900">
                    Stop losing revenue to{" "}
                    <span className="text-[#0F6E56]">scope creep</span>
                </h1>

                <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500">
                    ScopeIQ helps agencies protect their revenue with AI-scored briefs, a
                    client approval portal, and automated change orders — all in one place.
                </p>

                <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/register"
                        className="flex items-center gap-2 rounded-xl bg-[#0F6E56] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0a5c47]"
                    >
                        Start for free
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Sign in to dashboard
                    </Link>
                </div>

                <p className="mt-4 text-xs text-gray-400">
                    No credit card required &middot; Setup in 5 minutes
                </p>

                {/* Hero mockup */}
                <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
                    <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="h-3 w-3 rounded-full bg-red-400" />
                        <div className="h-3 w-3 rounded-full bg-yellow-400" />
                        <div className="h-3 w-3 rounded-full bg-green-400" />
                        <span className="ml-2 text-xs text-gray-400">app.scopeiq.io/dashboard</span>
                    </div>
                    <div className="grid grid-cols-4 bg-[#0F6E56]/5">
                        {/* Sidebar preview */}
                        <div className="col-span-1 border-r border-gray-200 bg-white p-4">
                            {["Dashboard", "Projects", "Briefs", "Clients", "Settings"].map((item) => (
                                <div
                                    key={item}
                                    className={`mb-1 rounded-lg px-3 py-2 text-xs font-medium ${item === "Dashboard" ? "bg-[#0F6E56]/10 text-[#0F6E56]" : "text-gray-500"}`}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                        {/* Main content preview */}
                        <div className="col-span-3 p-6">
                            <div className="mb-4 grid grid-cols-3 gap-3">
                                {[
                                    { label: "Active Projects", value: "12" },
                                    { label: "Pending Briefs", value: "4" },
                                    { label: "Awaiting Approval", value: "7" },
                                ].map((m) => (
                                    <div key={m.label} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                                        <p className="text-xs text-gray-400">{m.label}</p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900">{m.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                {["Brand Identity — Nike", "Web Redesign — Spotify", "Campaign — LVMH"].map((p) => (
                                    <div key={p} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2">
                                        <span className="text-xs font-medium text-gray-700">{p}</span>
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="bg-gray-50 py-20">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Everything your agency needs
                        </h2>
                        <p className="mt-3 text-gray-500">
                            Built around the real workflow of creative teams.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map(({ icon: Icon, title, description }) => (
                            <div
                                key={title}
                                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F6E56]/10">
                                    <Icon className="h-5 w-5 text-[#0F6E56]" />
                                </div>
                                <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
                                <p className="text-sm leading-relaxed text-gray-500">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-20">
                <div className="mx-auto max-w-4xl px-6">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
                        <p className="mt-3 text-gray-500">
                            From brief to approval in three steps.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {steps.map(({ step, title, body }) => (
                            <div key={step} className="flex gap-6">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F6E56] text-sm font-bold text-white">
                                    {step}
                                </div>
                                <div className="pt-1">
                                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#0F6E56] py-16">
                <div className="mx-auto max-w-2xl px-6 text-center">
                    <h2 className="text-3xl font-bold text-white">
                        Ready to protect your revenue?
                    </h2>
                    <p className="mt-3 text-[#a3d9cb]">
                        Join agencies that use ScopeIQ to run tighter projects and get paid
                        for every hour.
                    </p>
                    <Link
                        href="/register"
                        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0F6E56] hover:bg-gray-100"
                    >
                        Get started free
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-8">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
                    <span className="text-sm font-bold text-[#0F6E56]">ScopeIQ</span>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <Link href="/login" className="hover:text-gray-600">Log in</Link>
                        <Link href="/register" className="hover:text-gray-600">Register</Link>
                    </div>
                    <p className="text-xs text-gray-400">© 2025 ScopeIQ</p>
                </div>
            </footer>
        </div>
    );
}
