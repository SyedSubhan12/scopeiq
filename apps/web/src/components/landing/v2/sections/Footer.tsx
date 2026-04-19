"use client";

import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "#" },
      { label: "API", href: "#" },
      { label: "Security", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "DPA", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="lv2-surface-dark border-t border-white/5 py-16 text-white/70">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 text-white">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
                <circle cx="14" cy="14" r="12" stroke="#1D9E75" strokeWidth="2" />
                <circle cx="14" cy="14" r="4" fill="#1D9E75" />
              </svg>
              <span className="font-display text-lg font-bold">ScopeIQ</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/60">
              Stop losing revenue to scope creep. Brief scoring, approval portals, real-time scope monitoring.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { Icon: Twitter, href: "#", label: "Twitter" },
                { Icon: Linkedin, href: "#", label: "LinkedIn" },
                { Icon: Github, href: "#", label: "GitHub" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-[#1D9E75] hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/50">{col.title}</h4>
              <ul className="mt-4 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-white/70 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-white/50">
          <p>© 2026 Novabots. All rights reserved.</p>
          <p>Made with care by Novabots · Built for creative agencies worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
