"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
];

export function HomeNavbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on anchor click
  const handleNavClick = () => setMobileOpen(false);

  return (
    <>
      <motion.header
        className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur"
        animate={{ boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none" }}
        transition={{ duration: 0.2 }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image
              src="/logo.svg"
              alt="ScopeIQ"
              width={180}
              height={180}
              className="h-10 w-auto sm:h-12"
              priority
            />
            <span className="text-xl font-bold text-[#0F6E56] sm:text-2xl">ScopeIQ</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative py-1 transition-colors hover:text-gray-900 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#0F6E56] after:transition-[width] after:duration-200 hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {checking ? (
              <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-100" />
            ) : loggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full bg-[#0F6E56] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0a5c47]"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Go to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 sm:inline"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-[#0F6E56] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0a5c47]"
                >
                  <span className="hidden sm:inline">Get started free</span>
                  <span className="sm:hidden">Start free</span>
                </Link>
              </>
            )}

            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              className="fixed inset-x-4 top-[4.5rem] z-40 rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-xl backdrop-blur-xl md:hidden"
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={handleNavClick}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.18 }}
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
                {!checking && !loggedIn && (
                  <Link
                    href="/login"
                    onClick={handleNavClick}
                    className="rounded-xl px-4 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Log in
                  </Link>
                )}
                <Link
                  href={loggedIn ? "/dashboard" : "/register"}
                  onClick={handleNavClick}
                  className="rounded-full bg-[#0F6E56] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#0a5c47]"
                >
                  {loggedIn ? "Go to Dashboard" : "Get started free"}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
