"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Ref for the success checkmark — Anime.js will target it
  const checkRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` },
    );

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSent(true);

    // Animate checkmark after state settles
    requestAnimationFrame(() => {
      if (!checkRef.current) return;
      void import("animejs").then((mod) => {
        const anime = mod.default ?? mod;
        anime({
          targets: checkRef.current,
          scale: [0, 1.2, 1],
          duration: 500,
          easing: "easeOutElastic(1, .8)",
        });
      });
    });
  }

  return (
    // Card slides up from y:24, opacity:0 on mount
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.0, 0, 0.2, 1] }}
    >
      {sent ? (
        <div className="text-center">
          <div ref={checkRef} className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1D9E75]/10">
            <CheckCircle className="h-7 w-7 text-[#1D9E75]" />
          </div>
          <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            We sent a password reset link to{" "}
            <span className="font-medium text-[rgb(var(--text-primary))]">{email}</span>
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm text-[#1D9E75] hover:underline"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
            Reset your password
          </h2>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-[rgb(var(--text-primary))]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20"
              />
            </div>

            {error && (
              <p className="text-sm text-status-red">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1D9E75] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#178a66] disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[rgb(var(--text-muted))]">
            <Link href="/login" className="text-[#1D9E75] hover:underline">
              Back to login
            </Link>
          </p>
        </>
      )}
    </motion.div>
  );
}
