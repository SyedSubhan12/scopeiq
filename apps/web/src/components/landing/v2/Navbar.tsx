"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { GlowButton } from "./ui/GlowButton";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Case Studies", href: "#testimonials" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.4,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Voxr-style: bg opacity interpolates with scroll (0 → 80% over first 50px)
  const { scrollY } = useScroll();
  const alpha = useTransform(scrollY, [0, 50], [0, 0.95]);
  const bg = useMotionTemplate`rgba(255, 255, 255, ${alpha})`;
  const borderA = useTransform(scrollY, [0, 50], [0, 0.05]);
  const borderColor = useMotionTemplate`rgba(0, 0, 0, ${borderA})`;
  const blur = useTransform(scrollY, [0, 50], [0, 8]);
  const blurFilter = useMotionTemplate`blur(${blur}px)`;

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{
          backgroundColor: bg,
          borderBottomColor: borderColor,
          backdropFilter: blurFilter,
          WebkitBackdropFilter: blurFilter,
        }}
        className="fixed inset-x-0 top-0 z-[100] h-[72px] border-b"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-8"
        >
          <motion.div variants={itemVariants}>
            <Link href="/" className="flex items-center gap-2 text-black" aria-label="ScopeIQ home">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
                <circle cx="14" cy="14" r="12" stroke="url(#navg)" strokeWidth="2" />
                <circle cx="14" cy="14" r="4" fill="#1D9E75" />
                <defs>
                  <linearGradient id="navg" x1="0" y1="0" x2="28" y2="28">
                    <stop offset="0" stopColor="#1D9E75" />
                    <stop offset="1" stopColor="#0F6E56" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="font-display text-lg font-bold tracking-tight">ScopeIQ</span>
            </Link>
          </motion.div>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                variants={itemVariants}
                className="text-sm font-medium text-black transition-colors hover:text-[#0F6E56]"
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

          <motion.div variants={itemVariants} className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-sm text-black transition-colors hover:text-[#0F6E56]"
            >
              Login
            </Link>
            <GlowButton href="/register" variant="primary" className="h-9 px-4 text-sm">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </motion.div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-black md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[110] bg-white px-6 py-6 md:hidden"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold text-black">ScopeIQ</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-black"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-10 flex flex-col gap-1" aria-label="Mobile">
              {NAV.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="font-display text-3xl font-bold text-black py-3"
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-10 flex flex-col gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#0F6E56] text-base font-medium text-white"
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-black/20 text-base text-black"
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
