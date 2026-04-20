"use client";

import React, { useState, Suspense, useLayoutEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { gsap } from "@/animations/utils/gsap.config";

/* ============================================================================
   ScopeIQ — Editorial Login
   Fraunces display · IBM Plex body · JetBrains Mono metadata
   Paper (#F0EDE4) + Moss (#196C4A)
   ============================================================================ */

const FONT_DISPLAY = "var(--font-serif), 'Fraunces', Georgia, serif";
const FONT_BODY = "var(--font-sans), 'IBM Plex Sans', system-ui, sans-serif";
const FONT_MONO = "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace";

const PAPER = "#F0EDE4";
const INK = "#0B0B0B";
const MOSS = "#196C4A";
const FOG = "#CFC9BB";

function EditorialShell({ children }: { children: React.ReactNode }) {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const blobRef = useRef<HTMLDivElement | null>(null);
  const ruleRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const root = leftRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const words = root.querySelectorAll<HTMLElement>("[data-word]");
      gsap.from(words, {
        y: 40,
        opacity: 0,
        filter: "blur(8px)",
        stagger: 0.05,
        duration: 1,
        ease: "power3.out",
        delay: 0.1,
      });
      gsap.from(root.querySelectorAll("[data-meta]"), {
        opacity: 0,
        y: 12,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.4,
      });
      gsap.to(blobRef.current, {
        x: 50,
        y: -30,
        scale: 1.15,
        repeat: -1,
        yoyo: true,
        duration: 8,
        ease: "sine.inOut",
      });
      gsap.to(ruleRef.current, {
        scaleX: 1,
        duration: 1.4,
        ease: "power3.inOut",
        delay: 0.3,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <main
      style={{ background: PAPER, color: INK, fontFamily: FONT_BODY }}
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* grain */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* ── LEFT: Editorial manifesto ────────────────────────────── */}
        <aside
          ref={leftRef}
          className="relative hidden overflow-hidden px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16"
          style={{
            background: `linear-gradient(180deg, ${PAPER} 0%, #E8E4D8 100%)`,
          }}
        >
          <div
            ref={blobRef}
            aria-hidden
            style={{
              background: `radial-gradient(closest-side, ${MOSS}33, transparent 70%)`,
            }}
            className="pointer-events-none absolute -left-32 top-20 h-[520px] w-[520px] rounded-full blur-3xl"
          />

          {/* top bar */}
          <div className="relative flex items-center justify-between">
            <Link
              href="/"
              data-meta
              style={{ fontFamily: FONT_MONO }}
              className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-ink/70 transition-colors hover:text-[color:var(--moss,#196C4A)]"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              Back to ScopeIQ
            </Link>
            <span
              data-meta
              style={{ fontFamily: FONT_MONO }}
              className="text-[11px] uppercase tracking-[0.22em] text-ink/55"
            >
              §00 · Sign in
            </span>
          </div>

          {/* headline */}
          <div className="relative">
            <div
              data-meta
              style={{ fontFamily: FONT_MONO, color: MOSS }}
              className="mb-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: MOSS }} />
              Vol. I — Ledger
            </div>

            <h1
              style={{
                fontFamily: FONT_DISPLAY,
                fontVariationSettings: "'opsz' 144, 'SOFT' 50",
              }}
              className="flex flex-wrap gap-x-4 gap-y-2 font-light leading-[0.95] tracking-[-0.02em] text-[clamp(3rem,6.5vw,5.75rem)]"
            >
              {["Bill", "what", "you", "built."].map((w, i) => (
                <span
                  key={i}
                  data-word
                  className="inline-block"
                  style={i === 3 ? { color: MOSS, fontStyle: "italic" } : undefined}
                >
                  {w}
                </span>
              ))}
            </h1>

            <div
              className="mt-10 h-[2px] w-64 origin-left scale-x-0"
              style={{ background: MOSS }}
              ref={ruleRef as any}
            />

            <p
              data-meta
              className="mt-8 max-w-md text-[1rem] leading-[1.6] text-ink/75"
            >
              Every hour you build deserves a line on the invoice. Sign in to
              check who&rsquo;s leaking revenue today — and stop it before
              Friday.
            </p>
          </div>

          {/* footer: stats */}
          <div
            className="relative grid grid-cols-3 gap-6 border-t pt-6"
            style={{ borderColor: FOG }}
          >
            {[
              { k: "Revenue recovered", v: "17.8%" },
              { k: "Flag detection", v: "4.2s" },
              { k: "Brief uplift", v: "83%" },
            ].map((s) => (
              <div key={s.k} data-meta>
                <div
                  style={{ fontFamily: FONT_MONO }}
                  className="text-[10px] uppercase tracking-[0.22em] text-ink/55"
                >
                  {s.k}
                </div>
                <div
                  style={{ fontFamily: FONT_DISPLAY }}
                  className="mt-1 text-[1.75rem] font-light tabular-nums leading-none"
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── RIGHT: Form ──────────────────────────────────────────── */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-14">
          {children}
        </section>
      </div>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";

  const [authMode, setAuthMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll("[data-card-item]"), {
        y: 18,
        opacity: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.2,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (authMode === "password") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return;
        }
        router.push("/dashboard");
      } else {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return;
        }
        setMagicLinkSent(true);
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <EditorialShell>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div
            className="relative overflow-hidden rounded-3xl border bg-white/80 p-10 text-center shadow-[0_40px_80px_-40px_rgba(25,108,74,0.35)] backdrop-blur"
            style={{ borderColor: "rgba(25,108,74,0.18)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full"
              style={{ background: `radial-gradient(closest-side, ${MOSS}55, transparent 70%)` }}
            />
            <div className="relative mb-6 flex justify-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: `${MOSS}15` }}
              >
                <Mail className="h-7 w-7" style={{ color: MOSS }} />
              </div>
            </div>
            <h2
              style={{ fontFamily: FONT_DISPLAY }}
              className="relative mb-4 text-[2.25rem] font-light leading-[1.05] tracking-[-0.02em]"
            >
              Check your <em style={{ color: MOSS }}>inbox.</em>
            </h2>
            <p className="relative mb-8 leading-relaxed text-ink/70">
              A magic link just landed at{" "}
              <span className="font-medium text-ink">{email}</span>. Click it to
              sign in instantly — no password required.
            </p>
            <Button
              variant="outline"
              className="relative h-12 w-full rounded-full border-ink/15 font-medium hover:bg-ink/5"
              style={{ fontFamily: FONT_MONO, fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase" }}
              onClick={() => setMagicLinkSent(false)}
            >
              Back to sign in
            </Button>
          </div>
        </motion.div>
      </EditorialShell>
    );
  }

  return (
    <EditorialShell>
      <div ref={cardRef} className="w-full max-w-[460px]">
        {/* Top meta row (mobile-visible brand) */}
        <div
          data-card-item
          className="mb-8 flex items-center justify-between lg:hidden"
        >
          <Link
            href="/"
            style={{ fontFamily: FONT_MONO }}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-ink/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            ScopeIQ
          </Link>
          <span
            style={{ fontFamily: FONT_MONO }}
            className="text-[11px] uppercase tracking-[0.22em] text-ink/55"
          >
            §00 · Sign in
          </span>
        </div>

        {/* Header */}
        <div data-card-item className="mb-10">
          <span
            style={{ fontFamily: FONT_MONO, color: MOSS }}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: MOSS }} />
            Members only
          </span>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontVariationSettings: "'opsz' 144, 'SOFT' 40",
            }}
            className="mt-4 text-[clamp(2.25rem,4vw,3.25rem)] font-light leading-[1.02] tracking-[-0.02em]"
          >
            Welcome <em style={{ color: MOSS }}>back.</em>
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/65">
            New to ScopeIQ?{" "}
            <Link
              href="/register"
              className="font-medium underline decoration-[1.5px] underline-offset-[6px] transition-colors hover:no-underline"
              style={{ color: MOSS }}
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* Auth mode switch */}
        <div data-card-item className="mb-7">
          <div
            className="relative flex rounded-full border p-1"
            style={{
              borderColor: "rgba(11,11,11,0.12)",
              background: "rgba(11,11,11,0.035)",
            }}
          >
            {(["magic", "password"] as const).map((m) => {
              const active = authMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAuthMode(m)}
                  style={{
                    fontFamily: FONT_MONO,
                    background: active ? INK : "transparent",
                    color: active ? PAPER : "rgba(11,11,11,0.55)",
                  }}
                  className="flex-1 rounded-full px-4 py-2.5 text-[11px] uppercase tracking-[0.22em] transition-all"
                >
                  {m === "magic" ? "Magic link" : "Password"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Success */}
        <AnimatePresence>
          {isRegistered && !error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
              className="overflow-hidden"
            >
              <div
                className="flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm"
                style={{
                  borderColor: `${MOSS}33`,
                  background: `${MOSS}0D`,
                  color: MOSS,
                }}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-medium">Account created. Please sign in.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 rounded-xl border border-[#D64C2C]/30 bg-[#D64C2C]/8 px-4 py-3.5 text-sm text-[#C23B1D]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D64C2C]/15 text-[11px] font-bold">!</span>
                <span className="font-medium">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form data-card-item onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2.5">
            <Label
              htmlFor="email"
              style={{ fontFamily: FONT_MONO }}
              className="ml-1 text-[10.5px] uppercase tracking-[0.22em] text-ink/60"
            >
              Email address
            </Label>
            <div className="relative group">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-ink/35 transition-colors group-focus-within:text-[color:var(--moss,#196C4A)]"
              />
              <Input
                id="email"
                type="email"
                placeholder="name@studio.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ fontFamily: FONT_BODY, fontSize: "1rem" }}
                className="h-14 rounded-2xl border-ink/12 bg-white/70 pl-12 font-medium text-ink placeholder:text-ink/35 focus:border-[color:var(--moss,#196C4A)] focus:bg-white focus:ring-4 focus:ring-[color:var(--moss,#196C4A)]/15"
                required
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {authMode === "password" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2.5 overflow-hidden"
              >
                <div className="flex items-end justify-between">
                  <Label
                    htmlFor="password"
                    style={{ fontFamily: FONT_MONO }}
                    className="ml-1 text-[10.5px] uppercase tracking-[0.22em] text-ink/60"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    style={{ fontFamily: FONT_MONO }}
                    className="text-[10.5px] uppercase tracking-[0.22em] text-ink/55 transition-colors hover:text-[color:var(--moss,#196C4A)]"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ fontFamily: FONT_BODY, fontSize: "1rem" }}
                    className="h-14 rounded-2xl border-ink/12 bg-white/70 pr-12 font-medium text-ink placeholder:text-ink/35 focus:border-[color:var(--moss,#196C4A)] focus:bg-white focus:ring-4 focus:ring-[color:var(--moss,#196C4A)]/15"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 transition-colors hover:text-[color:var(--moss,#196C4A)]"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={isLoading}
            style={{
              fontFamily: FONT_MONO,
              background: INK,
              color: PAPER,
              letterSpacing: "0.22em",
            }}
            className="group relative mt-2 h-14 w-full overflow-hidden rounded-full text-[12px] uppercase shadow-lg transition-all hover:-translate-y-[1px] hover:opacity-95 active:translate-y-0 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="relative flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {authMode === "magic" ? "Sending link" : "Signing in"}
              </span>
            ) : (
              <span className="relative inline-flex items-center gap-3">
                {authMode === "magic" ? "Send magic link" : "Sign in"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
            {/* hover shine */}
            <span
              aria-hidden
              style={{
                background: `linear-gradient(120deg, transparent 0%, ${MOSS}55 50%, transparent 100%)`,
              }}
              className="absolute inset-0 -translate-x-full skew-x-[-20deg] transition-transform duration-700 group-hover:translate-x-full"
            />
          </Button>
        </form>

        {/* Divider */}
        <div data-card-item className="my-8 flex items-center gap-4">
          <div className="flex-1 border-t" style={{ borderColor: "rgba(11,11,11,0.1)" }} />
          <span
            style={{ fontFamily: FONT_MONO }}
            className="text-[10px] uppercase tracking-[0.28em] text-ink/45"
          >
            or continue with
          </span>
          <div className="flex-1 border-t" style={{ borderColor: "rgba(11,11,11,0.1)" }} />
        </div>

        <div data-card-item>
          <GoogleAuthButton label="Continue with Google" />
        </div>

        <p
          data-card-item
          style={{ fontFamily: FONT_MONO }}
          className="mt-10 text-center text-[10px] uppercase tracking-[0.22em] text-ink/45"
        >
          By signing in you agree to our{" "}
          <Link href="/terms" className="underline-offset-4 hover:underline">
            Terms
          </Link>{" "}
          · <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy</Link>
        </p>
      </div>
    </EditorialShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: PAPER, color: INK, fontFamily: FONT_MONO }}
        >
          <span className="text-[11px] uppercase tracking-[0.22em] opacity-60">
            Loading…
          </span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
