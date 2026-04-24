"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValue, animate, useInView } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { gsap, ScrollTrigger } from "@/animations/utils/gsap.config";

/* ============================================================================
   ScopeIQ — "Bill what you built."
   Editorial minimalism. Swiss grid. Serif display + mono accents.
   Paper / Ink / Moss / Ember.
   ============================================================================ */

const FONT_DISPLAY = "var(--font-serif), 'Fraunces', 'Iowan Old Style', Georgia, serif";
const FONT_BODY = "var(--font-sans), 'IBM Plex Sans', system-ui, sans-serif";
const FONT_MONO = "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace";

const PAPER = "#F0EDE4";
const INK = "#0B0B0B";
const MOSS = "#196C4A";
const MOSS_STAMP = "rgb(25,106,73)";
const MOSS_DEEP = "#125238";
const EMBER = "#D64C2C";
const FOG = "#CFC9BB";

export function BillWhatYouBuiltLanding() {
  return (
    <main
      style={{ background: PAPER, color: INK, fontFamily: FONT_BODY }}
      className="relative min-h-screen overflow-hidden selection:bg-[#0B0B0B] selection:text-[#F2EFE6]"
    >
      <GrainOverlay />
      <GridOverlay />
      <Nav />
      <Hero />
      <MossManifesto />
      <Ticker />
      <LeakSection />
      <HowSection />
      <LiveFlagDemo />
      <MetricsSection />
      <ClosingCTA />
      <Footer />
    </main>
  );
}

/* ---------------------------------------------------------------- overlays */

function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.08] mix-blend-multiply"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}

function GridOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.12]"
      style={{
        backgroundImage: `linear-gradient(${FOG} 1px, transparent 1px), linear-gradient(90deg, ${FOG} 1px, transparent 1px)`,
        backgroundSize: "88px 88px",
        maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)",
      }}
    />
  );
}

/* -------------------------------------------------------------------- nav */

function Nav() {
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !authLoading && !!user;

  const headerRef = useRef<HTMLElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLSpanElement | null>(null);
  const linksRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLAnchorElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);

  // Entrance timeline + scroll shrink
  useLayoutEffect(() => {
    const header = headerRef.current;
    const shell = shellRef.current;
    const links = linksRef.current;
    if (!header || !shell) return;

    const ctx = gsap.context(() => {
      // Entrance: drop + fade with char stagger on links
      const linkEls = links?.querySelectorAll<HTMLAnchorElement>("[data-nav-link]") ?? [];
      gsap.from(shell, {
        y: -28,
        opacity: 0,
        duration: 1.1,
        ease: "power4.out",
      });
      gsap.from(linkEls, {
        y: -14,
        opacity: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.25,
      });
      gsap.from(logoRef.current, {
        rotate: -90,
        scale: 0.6,
        opacity: 0,
        duration: 1.1,
        ease: "back.out(1.7)",
      });

      // Status dot pulse — infinite
      gsap.to(dotRef.current, {
        scale: 1.6,
        opacity: 0.25,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Scroll shrink
      gsap.to(shell, {
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: "rgba(240,237,228,0.86)",
        backdropFilter: "blur(14px)",
        borderColor: "rgba(11,11,11,0.12)",
        boxShadow: "0 8px 28px -18px rgba(11,11,11,0.35)",
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: 40,
          end: 220,
          scrub: true,
        },
      });
    }, header);

    return () => ctx.revert();
  }, []);

  // Magnetic logo — follows cursor when inside nav
  const onLogoMove = (e: React.MouseEvent) => {
    const el = logoRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - (r.left + r.width / 2);
    const my = e.clientY - (r.top + r.height / 2);
    gsap.to(el, { x: mx * 0.25, y: my * 0.25, rotate: mx * 0.08, duration: 0.6, ease: "power3.out" });
  };
  const onLogoLeave = () => {
    gsap.to(logoRef.current, { x: 0, y: 0, rotate: 0, duration: 0.8, ease: "elastic.out(1,0.5)" });
  };

  // Link hover — underline sweep
  const onLinkEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const bar = e.currentTarget.querySelector("[data-nav-underline]");
    if (!bar) return;
    gsap.fromTo(
      bar,
      { scaleX: 0, transformOrigin: "left center" },
      { scaleX: 1, duration: 0.45, ease: "power3.out" },
    );
  };
  const onLinkLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const bar = e.currentTarget.querySelector("[data-nav-underline]");
    if (!bar) return;
    gsap.to(bar, { scaleX: 0, transformOrigin: "right center", duration: 0.35, ease: "power2.in" });
  };

  // CTA hover — moss glow + arrow launch
  const onCtaEnter = () => {
    gsap.to(ctaRef.current, {
      y: -2,
      boxShadow: `0 18px 40px -12px ${MOSS}, 0 0 0 1px ${MOSS}`,
      duration: 0.4,
      ease: "power3.out",
    });
  };
  const onCtaLeave = () => {
    gsap.to(ctaRef.current, {
      y: 0,
      boxShadow: "0 0 0 0 rgba(0,0,0,0)",
      duration: 0.45,
      ease: "power2.out",
    });
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-40 px-3 pt-3 md:px-6 md:pt-5">
      <div
        ref={shellRef}
        style={{
          background: "rgba(240,237,228,0.55)",
          borderColor: "rgba(11,11,11,0.06)",
        }}
        className="mx-auto flex max-w-[1440px] items-center justify-between rounded-full border px-4 py-3 md:px-6 md:py-4"
      >
        <div
          className="flex cursor-pointer items-center gap-3"
          onMouseMove={onLogoMove}
          onMouseLeave={onLogoLeave}
        >
          <span ref={logoRef} className="inline-block">
            <Monogram />
          </span>
          <span
            style={{ fontFamily: FONT_MONO }}
            className="hidden text-[11px] uppercase tracking-[0.22em] text-ink/60 sm:inline"
          >
            ScopeIQ
            <span style={{ color: MOSS }} className="mx-2">/</span>
            <span>est. 2026</span>
          </span>
        </div>

        <div
          ref={linksRef}
          style={{ fontFamily: FONT_MONO }}
          className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.22em] md:flex"
        >
          {[
            { href: "#leak", label: "§01 · Leak" },
            { href: "#how", label: "§02 · Method" },
            { href: "#live", label: "§03 · Live" },
            { href: "#proof", label: "§04 · Proof" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-nav-link
              onMouseEnter={onLinkEnter}
              onMouseLeave={onLinkLeave}
              className="relative rounded-full px-3 py-2 transition-colors hover:text-[color:var(--moss,#196C4A)]"
            >
              {l.label}
              <span
                data-nav-underline
                style={{ background: MOSS, transformOrigin: "left center", transform: "scaleX(0)" }}
                className="pointer-events-none absolute inset-x-3 bottom-1 h-[2px]"
              />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            style={{ fontFamily: FONT_MONO }}
            className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] md:inline-flex"
          >
            <span className="relative flex h-2 w-2">
              <span ref={dotRef} style={{ background: MOSS }} className="inline-flex h-2 w-2 rounded-full" />
            </span>
            <span className="text-ink/70">Live</span>
          </span>

          {!authLoading && (
            isLoggedIn ? (
              <Link
                ref={ctaRef}
                href="/dashboard"
                onMouseEnter={onCtaEnter}
                onMouseLeave={onCtaLeave}
                style={{ fontFamily: FONT_MONO, background: MOSS, color: PAPER }}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.22em]"
              >
                <span className="relative z-10">Dashboard</span>
                <span className="relative z-10 transition-transform group-hover:translate-x-1">→</span>
                <span
                  aria-hidden
                  style={{
                    background: `linear-gradient(120deg, transparent 0%, rgba(240,237,228,0.45) 50%, transparent 100%)`,
                  }}
                  className="absolute inset-0 -translate-x-full skew-x-[-20deg] transition-transform duration-700 group-hover:translate-x-full"
                />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{ fontFamily: FONT_MONO }}
                  className="hidden rounded-full border border-[#0B0B0B]/15 px-4 py-2 text-[11px] uppercase tracking-[0.22em] transition hover:border-[#0B0B0B] md:inline-block"
                >
                  Sign in
                </Link>
                <Link
                  ref={ctaRef}
                  href="/register"
                  onMouseEnter={onCtaEnter}
                  onMouseLeave={onCtaLeave}
                  style={{ fontFamily: FONT_MONO, background: MOSS, color: PAPER }}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.22em]"
                >
                  <span className="relative z-10">Start billing</span>
                  <span className="relative z-10 transition-transform group-hover:translate-x-1">→</span>
                  <span
                    aria-hidden
                    style={{
                      background: `linear-gradient(120deg, transparent 0%, rgba(240,237,228,0.45) 50%, transparent 100%)`,
                    }}
                    className="absolute inset-0 -translate-x-full skew-x-[-20deg] transition-transform duration-700 group-hover:translate-x-full"
                  />
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}

/* --------------------------------------------------- moss manifesto block */

function MossManifesto() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const words = root.querySelectorAll<HTMLElement>("[data-moss-word]");
      gsap.from(words, {
        y: 40,
        opacity: 0,
        filter: "blur(8px)",
        stagger: 0.045,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
      gsap.from(root.querySelector("[data-moss-pill]"), {
        scale: 0.6,
        opacity: 0,
        duration: 0.7,
        ease: "back.out(1.8)",
        scrollTrigger: { trigger: root, start: "top 80%" },
      });
      gsap.to(root.querySelector("[data-moss-blob]"), {
        x: 40,
        y: -30,
        scale: 1.15,
        repeat: -1,
        yoyo: true,
        duration: 6,
        ease: "sine.inOut",
      });
      gsap.to(root.querySelector("[data-moss-rule]"), {
        scaleX: 1,
        duration: 1.4,
        ease: "power3.inOut",
        scrollTrigger: { trigger: root, start: "top 75%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const manifesto = [
    "We", "believe", "every", "hour", "you", "build",
    "deserves", "a", "line", "on", "the", "invoice.",
  ];

  return (
    <section ref={rootRef} className="relative z-10 overflow-hidden px-6 py-24 md:px-12 md:py-32">
      <div
        data-moss-blob
        aria-hidden
        style={{
          background: `radial-gradient(closest-side, ${MOSS}22, transparent 70%)`,
        }}
        className="pointer-events-none absolute -left-32 top-10 h-[520px] w-[520px] rounded-full blur-2xl"
      />

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-2">
          <div
            data-moss-pill
            style={{ background: MOSS, color: PAPER, fontFamily: FONT_MONO }}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.22em]"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: PAPER }} />
            Manifesto
          </div>
        </div>

        <div className="col-span-12 md:col-span-10">
          <p
            style={{ fontFamily: FONT_DISPLAY }}
            className="flex flex-wrap gap-x-4 gap-y-2 font-light leading-[1.05] tracking-[-0.02em] text-[clamp(2rem,5.5vw,5rem)] text-[color:var(--ink)]/90"
          >
            {manifesto.map((w, i) => (
              <span
                key={i}
                data-moss-word
                className="inline-block"
                style={
                  w === "build" || w === "invoice."
                    ? { color: MOSS, fontStyle: "italic" }
                    : undefined
                }
              >
                {w}
              </span>
            ))}
          </p>

          <div
            data-moss-rule
            style={{ background: MOSS, transformOrigin: "left center", transform: "scaleX(0)" }}
            className="mt-10 h-[2px] w-full"
          />

          <div
            style={{ fontFamily: FONT_MONO }}
            className="mt-6 flex flex-wrap items-center gap-6 text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)]/60"
          >
            <span style={{ color: MOSS }}>◆</span>
            <span>No creep, no compromise</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Monogram() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="4" stroke={INK} strokeWidth="1.2" />
      <text
        x="50%"
        y="56%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-serif), Georgia"
        fontSize="18"
        fontStyle="italic"
        fill={INK}
      >
        S
      </text>
      <circle cx="32" cy="32" r="2.4" fill={EMBER} />
    </svg>
  );
}

/* --------------------------------------------------------- hero background */

function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Non-null assert: we return early above if ctx is null; tsc can't narrow across closures
    const ctx = canvas.getContext("2d")!;

    let animId: number;
    let time = 0;
    let scanX = 0;

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    type NodeKind = "brief" | "scored" | "flagged" | "approved";
    interface BriefNode {
      x: number; y: number;
      vx: number; vy: number;
      r: number;
      kind: NodeKind;
      phase: number;
    }

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 12 : 36;
    const nodes: BriefNode[] = Array.from({ length: COUNT }, () => {
      const roll = Math.random();
      const kind: NodeKind =
        roll < 0.48 ? "scored" :
          roll < 0.72 ? "brief" :
            roll < 0.88 ? "flagged" : "approved";

      // On mobile, keep nodes more towards the center-right to avoid clashing with the left-aligned text
      // if it was left-aligned. Actually the user wants them centered.
      const x = isMobile
        ? (0.2 + Math.random() * 0.6) * W()
        : Math.random() * W();

      return {
        x,
        y: Math.random() * H(),
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 3.5 + 3,
        kind,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const NODE_RGB: Record<NodeKind, string> = {
      brief: "25,106,73",
      scored: "25,106,73",
      flagged: "214,76,44",
      approved: "25,106,73",
    };
    const CONNECT = isMobile ? 120 : 200;
    const SCAN_SPEED = 0.28;

    function draw() {
      time += 0.016;
      scanX = (scanX + SCAN_SPEED) % (W() + 160);

      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);

      // Update positions, bounce off walls
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) { n.vx *= -1; n.x = Math.max(0, Math.min(w, n.x)); }
        if (n.y < 0 || n.y > h) { n.vy *= -1; n.y = Math.max(0, Math.min(h, n.y)); }
      }

      // Connections — the "scope web"
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT) {
            const alpha = (1 - dist / CONNECT) * 0.22;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(25,106,73,${alpha.toFixed(3)})`;
            ctx.stroke();
          }
        }
      }

      // Nodes + halos
      for (const n of nodes) {
        const rgb = NODE_RGB[n.kind];
        const pulse = Math.sin(time * 1.6 + n.phase);

        // All nodes get a soft ambient glow
        const glowR = n.r + 8 + pulse * 3;
        const glow = ctx.createRadialGradient(n.x, n.y, n.r * 0.3, n.x, n.y, glowR);
        glow.addColorStop(0, `rgba(${rgb},${n.kind === "flagged" ? 0.45 : 0.22})`);
        glow.addColorStop(1, `rgba(${rgb},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Solid core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},0.75)`;
        ctx.fill();

        // Ring on flagged nodes
        if (n.kind === "flagged") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 2 + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb},0.5)`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // Horizontal scan beam
      const bx = scanX - 100;
      if (bx < w + 120) {
        const sg = ctx.createLinearGradient(bx, 0, bx + 140, 0);
        sg.addColorStop(0, "rgba(25,106,73,0)");
        sg.addColorStop(0.5, "rgba(25,106,73,0.07)");
        sg.addColorStop(1, "rgba(25,106,73,0.01)");
        ctx.fillStyle = sg;
        ctx.fillRect(bx, 0, 140, h);

        ctx.beginPath();
        ctx.moveTo(bx + 100, 0);
        ctx.lineTo(bx + 100, h);
        ctx.strokeStyle = "rgba(25,106,73,0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Radar rings — Center on mobile, top-right on desktop
      const rx = isMobile ? w * 0.5 : w * 0.82;
      const ry = isMobile ? h * 0.35 : h * 0.22;
      for (let i = 0; i < 4; i++) {
        const phase = ((time * 0.35 + i * 0.62) % 1);
        const r = phase * Math.min(w, h) * (isMobile ? 0.4 : 0.55);
        const alpha = (1 - phase) * 0.18;
        ctx.beginPath();
        ctx.arc(rx, ry, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(25,106,73,${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Center pulse
      const cx = w * 0.5;
      const cy = h * 0.28;
      const cp = ((time * 0.5) % 1);
      ctx.beginPath();
      ctx.arc(cx, cy, cp * w * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(25,106,73,${((1 - cp) * 0.06).toFixed(3)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/* ------------------------------------------------------------------- hero */

function Hero() {
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !authLoading && !!user;
  const h1Ref = useRef<HTMLHeadingElement | null>(null);
  const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%";

  // One-time slide-up reveal
  useLayoutEffect(() => {
    const h1 = h1Ref.current;
    if (!h1) return;
    const ctx = gsap.context(() => {
      const chars = h1.querySelectorAll<HTMLElement>("[data-char]");
      gsap.from(chars, {
        y: 64,
        opacity: 0,
        stagger: { amount: 0.55, ease: "power2.in" },
        duration: 0.75,
        ease: "power4.out",
        delay: 0.1,
      });
    }, h1);
    return () => ctx.revert();
  }, []);

  // Looping scramble — fires at 1.1s then every 5s
  useEffect(() => {
    const h1 = h1Ref.current;
    if (!h1) return;

    function scramble() {
      const chars = h1!.querySelectorAll<HTMLElement>("[data-char]");
      const delays: ReturnType<typeof setTimeout>[] = [];
      const intervals: ReturnType<typeof setInterval>[] = [];

      Array.from(chars).forEach((el, idx) => {
        const orig = el.dataset.orig ?? el.textContent ?? "";
        if (!el.dataset.orig) el.dataset.orig = orig;
        if (!/[a-zA-Z0-9]/.test(orig)) return;

        const d = setTimeout(() => {
          let t = 0;
          const iv = setInterval(() => {
            el.textContent = POOL[Math.floor(Math.random() * POOL.length)] ?? orig;
            if (++t >= 6) { clearInterval(iv); el.textContent = orig; }
          }, 34);
          intervals.push(iv);
        }, idx * 26);
        delays.push(d);
      });

      return () => {
        delays.forEach(clearTimeout);
        intervals.forEach(clearInterval);
        // Restore originals on cleanup
        h1!.querySelectorAll<HTMLElement>("[data-char]").forEach(el => {
          if (el.dataset.orig) el.textContent = el.dataset.orig;
        });
      };
    }

    const t0 = setTimeout(scramble, 1100);
    const loop = setInterval(scramble, 5000);
    return () => { clearTimeout(t0); clearInterval(loop); };
  }, [POOL]);

  return (
    <section className="relative z-10 overflow-hidden px-6 pt-16 pb-8 md:px-12 md:pt-24">
      <HeroBackground />

      <div className="relative mx-auto max-w-[1440px]">

        {/* ── Section meta label ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.7 }}
          style={{ fontFamily: FONT_MONO }}
          className="mb-10 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.26em] text-[color:var(--ink)]/40"
        >
          <span className="h-px w-8 bg-current opacity-30" />
          <span style={{ color: EMBER }}>§00</span>
          <span className="opacity-30">/</span>
          <span>Thesis · Vol. I · 2026</span>
          <span className="h-px w-8 bg-current opacity-30" />
        </motion.div>

        {/* ── Hero heading — full width, centered ────────────────────── */}
        <h1
          ref={h1Ref}
          style={{ fontFamily: FONT_DISPLAY, fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
          className="text-center font-light leading-[0.9] tracking-[-0.025em] text-[clamp(2.8rem,8vw,9.5rem)] md:whitespace-nowrap"
        >
          {/* "Bill what" — Ink on Paper */}
          <span className="inline-block pr-[0.25em]">
            {"Bill".split("").map((c, ci) => (
              <span key={ci} data-char data-orig={c} className="inline-block italic">{c}</span>
            ))}
          </span>
          <span className="inline-block pr-[0.28em]">
            {"what".split("").map((c, ci) => (
              <span key={ci} data-char data-orig={c} className="inline-block">{c}</span>
            ))}
          </span>

          {/* "you built." — Beige on Moss stamp */}
          <span
            style={{
              background: MOSS_STAMP,
              color: PAPER,
              padding: "0.03em 0.22em 0.07em",
              display: "inline",
            }}
          >
            <span className="inline-block pr-[0.25em]">
              {"you".split("").map((c, ci) => (
                <span key={ci} data-char data-orig={c} className="inline-block">{c}</span>
              ))}
            </span>
            <span className="relative inline-block">
              {"built.".split("").map((c, ci) => (
                <span key={ci} data-char data-orig={c} className="inline-block">{c}</span>
              ))}
              <UnderMeasure onDark />
            </span>
          </span>
        </h1>

        {/* ── Sub-content ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="mx-auto mt-12 grid max-w-5xl grid-cols-12 gap-6"
        >
          <p className="col-span-12 text-[clamp(0.95rem,1.3vw,1.2rem)] leading-[1.6] text-[color:var(--ink)]/75 md:col-span-7">
            ScopeIQ catches every vague brief before work starts, flags every out-of-scope
            request the moment a client types it, and converts the silent revisions you used
            to absorb into signed change orders.
            <span className="block pt-3 text-[color:var(--ink)]/45">
              Written for creative studios that are tired of eating the difference.
            </span>
          </p>

          <div className="col-span-12 md:col-span-5 md:pl-8">
            <div style={{ borderLeft: `1px solid ${FOG}` }} className="space-y-3 pl-6">
              <Stat label="Avg. revenue recovered" value="17.8%" />
              <Stat label="Scope creep caught in" value="4.2s" />
              <Stat label="Briefs upgraded past 75 clarity" value="83%" />
            </div>
          </div>
        </motion.div>

        {/* ── CTAs ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.7 }}
          className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center gap-4"
        >
          <Link
            href={isLoggedIn ? "/dashboard" : "/register"}
            style={{ background: INK, color: PAPER, fontFamily: FONT_MONO }}
            className="group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-[12px] uppercase tracking-[0.2em] transition hover:-translate-y-[1px]"
          >
            {isLoggedIn ? "Go to Dashboard" : "Start billing"}
            <span className="transition group-hover:translate-x-1">→</span>
          </Link>
          <a
            href="#live"
            style={{ fontFamily: FONT_MONO }}
            className="inline-flex items-center gap-3 rounded-full border border-[#0B0B0B]/20 px-6 py-3.5 text-[12px] uppercase tracking-[0.2em] hover:border-[#0B0B0B]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D64C2C] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D64C2C]" />
            </span>
            Watch it flag creep
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function UnderMeasure({ onDark = false }: { onDark?: boolean }) {
  const stroke = onDark ? PAPER : EMBER;
  return (
    <motion.svg
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ delay: 1.2, duration: 1.2, ease: "easeInOut" }}
      viewBox="0 0 200 18"
      preserveAspectRatio="none"
      className="absolute -bottom-[0.12em] left-0 h-[0.18em] w-full"
      aria-hidden
    >
      <motion.path
        d="M0 9 L200 9"
        stroke={stroke}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1.2, duration: 1, ease: "easeInOut" }}
      />
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <motion.line
          key={i}
          x1={p * 200}
          x2={p * 200}
          y1={i % 2 ? 4 : 1}
          y2={i % 2 ? 14 : 17}
          stroke={stroke}
          strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 + i * 0.05 }}
        />
      ))}
    </motion.svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span
        style={{ fontFamily: FONT_MONO }}
        className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink)]/55"
      >
        {label}
      </span>
      <span
        style={{ fontFamily: FONT_DISPLAY }}
        className="text-lg tabular-nums"
      >
        {value}
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------- ticker */

function Ticker() {
  const items = [
    "Brief #BR-1034 · clarity 48 → auto-hold",
    "Flag #SG-0291 · “one more version” → scope",
    "Change order CO-044 · +$2,400 · signed",
    "Deliverable DL-812 · client auto-approved",
    "Brief #BR-1042 · clarity 51 → clarification sent",
    "Flag #SG-0294 · “slightly different direction” → scope",
    "Change order CO-047 · +$1,150 · signed",
    "SOW parsed · 6 clauses · 3 revisions max",
  ];
  return (
    <div
      className="relative z-10 mt-20 border-y"
      style={{ borderColor: FOG, background: "rgba(11,11,11,0.02)" }}
    >
      <div className="relative flex overflow-hidden py-4">
        <motion.div
          className="flex shrink-0 gap-12 whitespace-nowrap pr-12"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 55, ease: "linear", repeat: Infinity }}
          style={{ fontFamily: FONT_MONO }}
        >
          {[...items, ...items, ...items].map((t, i) => (
            <span
              key={i}
              className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)]/65"
            >
              <span className="mr-3 text-[color:var(--ember)]">◆</span>
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ leak section */

function LeakSection() {
  return (
    <section id="leak" className="relative z-10 px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
        <SectionMarker n="01" label="The silent leak" />

        <div className="col-span-12 md:col-span-10 md:col-start-3">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ fontFamily: FONT_DISPLAY }}
            className="font-light leading-[0.95] tracking-[-0.02em] text-[clamp(2.5rem,7vw,6.5rem)]"
          >
            Seventy-nine percent <br />
            of agency work is{" "}
            <em style={{ color: EMBER }}>unpaid revision.</em>
          </motion.h2>

          <div className="mt-16 grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6">
              <p className="max-w-xl text-[1rem] leading-[1.7] text-[color:var(--ink)]/80">
                You wrote a SOW. The client said &ldquo;looks good.&rdquo; Then came the
                Slack message. &ldquo;Can we try one more direction?&rdquo; &ldquo;Just a
                tiny tweak.&rdquo; &ldquo;While you&rsquo;re in there…&rdquo;
                <br />
                <br />
                None of those are in the contract. All of them get done anyway. By the end
                of the quarter you&rsquo;ve delivered a second project for free and called
                it &ldquo;relationship building.&rdquo;
              </p>
            </div>

            <div className="col-span-12 md:col-span-6">
              <LeakLedger />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LeakLedger() {
  const rows = [
    { label: "Extra rounds, no change order", cost: "−$14,200" },
    { label: "Hours outside original SOW", cost: "−$8,650" },
    { label: "Silent approval rework", cost: "−$3,900" },
    { label: "Friday-night &ldquo;quick&rdquo; fixes", cost: "−$2,100" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ fontFamily: FONT_MONO, borderColor: FOG }}
      className="border-t"
    >
      {rows.map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          style={{ borderColor: FOG }}
          className="flex items-center justify-between border-b py-4 text-[12px]"
        >
          <span
            className="uppercase tracking-[0.18em] text-[color:var(--ink)]/70"
            dangerouslySetInnerHTML={{ __html: r.label }}
          />
          <span className="tabular-nums text-[color:var(--ember)]">{r.cost}</span>
        </motion.div>
      ))}
      <div className="flex items-center justify-between pt-5 text-[13px]">
        <span className="uppercase tracking-[0.18em]">One quarter, one studio</span>
        <span
          style={{ fontFamily: FONT_DISPLAY }}
          className="text-2xl tabular-nums"
        >
          −$28,850
        </span>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------- how section */

function HowSection() {
  const phases = [
    {
      n: "01",
      title: "Brief",
      body:
        "Paste a client email or fill the form. The brief is scored 0–100 for clarity before a single hour is logged. Below 60, it&rsquo;s held and the gaps are sent back to the client.",
      mono: "clarityScore.compute() → 48",
    },
    {
      n: "02",
      title: "Build",
      body:
        "Deliverables live in a white-label portal. Every revision is counted against the SOW. Every client message is scanned for scope-creep phrasing in real time.",
      mono: "scopeGuard.scan(&ldquo;one more round&rdquo;) → flag",
    },
    {
      n: "03",
      title: "Bill",
      body:
        "Flags become pre-filled change orders — scope items, pricing, clauses. You approve. The client signs in the portal. You go back to making the thing.",
      mono: "changeOrder.send(CO-044) → +$2,400",
    },
  ];

  return (
    <section id="how" className="relative z-10 px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
        <SectionMarker n="02" label="The method" />

        <div className="col-span-12 md:col-span-10 md:col-start-3">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8 }}
            style={{ fontFamily: FONT_DISPLAY }}
            className="mb-20 max-w-4xl font-light leading-[1] tracking-[-0.02em] text-[clamp(2rem,5vw,4.5rem)]"
          >
            Three movements. <em>Brief,</em> build, bill.
          </motion.h2>

          <div className="grid grid-cols-12 gap-6">
            {phases.map((p, i) => (
              <PhaseCard key={p.n} {...p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PhaseCard({
  n,
  title,
  body,
  mono,
  index,
}: {
  n: string;
  title: string;
  body: string;
  mono: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
      className="col-span-12 md:col-span-4"
    >
      <div
        style={{ borderColor: FOG }}
        className="group relative flex h-full flex-col border-t pt-6"
      >
        <div
          style={{ fontFamily: FONT_MONO }}
          className="mb-10 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)]/55"
        >
          <span>§{n}</span>
          <motion.span
            animate={inView ? { opacity: [0, 1], x: [-6, 0] } : {}}
            transition={{ delay: index * 0.12 + 0.4 }}
          >
            {index < 2 ? "→" : "◆"}
          </motion.span>
        </div>

        <h3
          style={{ fontFamily: FONT_DISPLAY }}
          className="mb-6 text-[clamp(2.5rem,4vw,4rem)] font-light leading-[0.95]"
        >
          {title}
        </h3>

        <p
          className="mb-8 text-[0.95rem] leading-[1.6] text-[color:var(--ink)]/75"
          dangerouslySetInnerHTML={{ __html: body }}
        />

        <div
          style={{ fontFamily: FONT_MONO, background: "rgba(11,11,11,0.04)", borderColor: FOG }}
          className="mt-auto overflow-hidden rounded border px-3 py-2.5 text-[11px] text-[color:var(--ink)]/70"
        >
          <span className="mr-2 text-[color:var(--moss)]">&gt;</span>
          <span dangerouslySetInnerHTML={{ __html: mono }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------- live scope-flag demo */

function LiveFlagDemo() {
  const messages = [
    { who: "Client", text: "Loving it! Can we try one more direction before Friday?" },
    { who: "Client", text: "Also — while you&rsquo;re in there, can we tweak the hero copy?" },
  ];
  const [step, setStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: false, margin: "-30%" });

  useEffect(() => {
    if (!inView) return;
    setStep(0);
    const timers = [
      setTimeout(() => setStep(1), 900),
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setStep(3), 3200),
      setTimeout(() => setStep(4), 4600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <section
      id="live"
      ref={sectionRef}
      style={{ background: INK, color: PAPER }}
      className="relative z-10 px-6 py-28 md:px-12 md:py-40"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
        <div
          style={{ fontFamily: FONT_MONO }}
          className="col-span-12 mb-12 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-[color:var(--paper)]/60 md:col-span-10 md:col-start-3"
        >
          <span>§03 / Live Detection</span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D64C2C] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D64C2C]" />
            </span>
            scope-guard · monitoring
          </span>
        </div>

        <div className="col-span-12 md:col-span-10 md:col-start-3">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ fontFamily: FONT_DISPLAY }}
            className="mb-20 max-w-4xl font-light leading-[1] tracking-[-0.02em] text-[clamp(2rem,5vw,4.5rem)]"
          >
            Watch a scope flag
            <br />
            <em style={{ color: EMBER }}>in the wild.</em>
          </motion.h2>

          <div className="grid grid-cols-12 gap-8">
            {/* message thread */}
            <div
              className="col-span-12 rounded-lg border p-6 md:col-span-7 md:p-8"
              style={{ borderColor: "rgba(242,239,230,0.12)", background: "rgba(242,239,230,0.03)" }}
            >
              <div
                style={{ fontFamily: FONT_MONO }}
                className="mb-5 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper)]/50"
              >
                <span>#client — Acme Design</span>
                <span>Thu 14:02</span>
              </div>

              <div className="space-y-5">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={step > i ? { opacity: 1, y: 0 } : { opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex gap-4"
                  >
                    <div
                      style={{ background: "rgba(242,239,230,0.1)" }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                    >
                      {m.who[0]}
                    </div>
                    <div>
                      <div
                        style={{ fontFamily: FONT_MONO }}
                        className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper)]/50"
                      >
                        {m.who}
                      </div>
                      <p
                        className="text-[0.95rem] leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html:
                            step >= 2 && i === 0
                              ? m.text.replace(
                                "one more direction",
                                `<mark style="background:${EMBER};color:${PAPER};padding:0 4px;border-radius:2px">one more direction</mark>`,
                              )
                              : step >= 3 && i === 1
                                ? m.text.replace(
                                  "tweak the hero copy",
                                  `<mark style="background:${EMBER};color:${PAPER};padding:0 4px;border-radius:2px">tweak the hero copy</mark>`,
                                )
                                : m.text,
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* flag panel */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={step >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              className="col-span-12 md:col-span-5"
            >
              <div
                style={{ borderColor: EMBER, background: "rgba(214,76,44,0.08)" }}
                className="rounded-lg border p-6"
              >
                <div
                  style={{ fontFamily: FONT_MONO }}
                  className="mb-5 flex items-center justify-between text-[10px] uppercase tracking-[0.22em]"
                >
                  <span style={{ color: EMBER }}>Scope flag · SG-0291</span>
                  <span className="text-[color:var(--paper)]/60">0.87 confidence</span>
                </div>

                <div
                  style={{ fontFamily: FONT_DISPLAY }}
                  className="mb-6 text-[1.75rem] font-light leading-[1.1]"
                >
                  2 items outside SOW detected.
                </div>

                <ul
                  style={{ fontFamily: FONT_MONO }}
                  className="mb-7 space-y-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--paper)]/75"
                >
                  <li className="flex justify-between">
                    <span>+ Additional direction</span>
                    <span className="text-[color:var(--paper)]">$2,400</span>
                  </li>
                  <li className="flex justify-between">
                    <span>+ Hero copy revision</span>
                    <span className="text-[color:var(--paper)]">$650</span>
                  </li>
                </ul>

                <div
                  style={{ borderColor: "rgba(242,239,230,0.15)" }}
                  className="flex items-center justify-between border-t pt-5"
                >
                  <span
                    style={{ fontFamily: FONT_MONO }}
                    className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper)]/60"
                  >
                    Suggested CO-044
                  </span>
                  <span
                    style={{ fontFamily: FONT_DISPLAY }}
                    className="text-3xl tabular-nums"
                  >
                    +$3,050
                  </span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={step >= 4 ? { opacity: 1 } : {}}
                transition={{ delay: 0.4, duration: 0.6 }}
                style={{ fontFamily: FONT_MONO }}
                className="mt-5 text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper)]/50"
              >
                Detected 4.2s after client message. Draft sent to owner. Client notified
                on approval.
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- metric / proof */

function MetricsSection() {
  return (
    <section id="proof" className="relative z-10 px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
        <SectionMarker n="04" label="Proof" />

        <div className="col-span-12 md:col-span-10 md:col-start-3">
          <div className="grid grid-cols-12 gap-6">
            <Metric col="md:col-span-7" to={17.8} suffix="%" label="Average quarterly revenue recovered from flagged scope" />
            <Metric col="md:col-span-5" to={4.2} suffix="s" label="Median detection time from client message to flag" />
            <Metric col="md:col-span-5" to={83} suffix="%" label="Briefs pushed past the 75-clarity threshold after coach feedback" />
            <Metric col="md:col-span-7" to={2.6} prefix="×" label="Faster close from deliverable ready to client sign-off" />
          </div>

          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.9 }}
            style={{ fontFamily: FONT_DISPLAY, borderColor: FOG }}
            className="mt-24 border-t pt-12 text-[clamp(1.5rem,3vw,2.75rem)] font-light leading-[1.2] tracking-[-0.01em]"
          >
            &ldquo;We stopped eating revisions in month one. Change orders are boring now —
            which is exactly what I wanted. <em style={{ color: MOSS }}>ScopeIQ pays for itself by lunch
              on Tuesdays.</em>&rdquo;
            <footer
              style={{ fontFamily: FONT_MONO }}
              className="mt-6 text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)]/55"
            >
              — M. Carver, partner · Carver&Co.
            </footer>
          </motion.blockquote>
        </div>
      </div>
    </section>
  );
}

function Metric({
  col,
  to,
  suffix,
  prefix,
  label,
}: {
  col: string;
  to: number;
  suffix?: string;
  prefix?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const val = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(val, to, {
      duration: 1.8,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => {
        const hasDecimal = to % 1 !== 0;
        setDisplay(hasDecimal ? v.toFixed(1) : Math.round(v).toString());
      },
    });
    return () => controls.stop();
  }, [inView, to, val]);

  return (
    <div ref={ref} className={`col-span-12 ${col}`}>
      <div style={{ borderColor: FOG }} className="flex h-full flex-col border-t pt-6">
        <div
          style={{ fontFamily: FONT_DISPLAY }}
          className="mb-5 font-light leading-[0.9] tracking-[-0.02em] text-[clamp(3.5rem,9vw,8rem)]"
        >
          {prefix}
          <span className="tabular-nums">{display}</span>
          {suffix}
        </div>
        <p className="max-w-sm text-[0.95rem] leading-[1.5] text-[color:var(--ink)]/65">
          {label}
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- closing */

function ClosingCTA() {
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !authLoading && !!user;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={ref} className="relative z-10 px-6 py-32 md:px-12 md:py-48">
      <div className="mx-auto max-w-[1440px]">
        <motion.h2
          style={{ fontFamily: FONT_DISPLAY, y }}
          className="font-light leading-[0.9] tracking-[-0.03em] text-[clamp(3rem,13vw,13rem)]"
        >
          Bill what
          <br />
          <em style={{ color: MOSS }}>you built.</em>
        </motion.h2>

        <div className="mt-12 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-5 md:col-start-8">
            <p className="mb-10 text-[1rem] leading-[1.6] text-[color:var(--ink)]/75">
              14-day trial. No card. Import an existing SOW and your first scope flag
              arrives before the kickoff call ends.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  style={{ background: INK, color: PAPER, fontFamily: FONT_MONO }}
                  className="group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-[12px] uppercase tracking-[0.2em] transition hover:-translate-y-[1px]"
                >
                  Go to Dashboard
                  <span className="transition group-hover:translate-x-1">→</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    style={{ background: INK, color: PAPER, fontFamily: FONT_MONO }}
                    className="group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-[12px] uppercase tracking-[0.2em] transition hover:-translate-y-[1px]"
                  >
                    Start billing
                    <span className="transition group-hover:translate-x-1">→</span>
                  </Link>
                  <Link
                    href="/login"
                    style={{ fontFamily: FONT_MONO }}
                    className="inline-flex rounded-full border border-[#0B0B0B]/20 px-6 py-3.5 text-[12px] uppercase tracking-[0.2em] hover:border-[#0B0B0B]"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ footer */

function Footer() {
  return (
    <footer
      style={{ borderColor: FOG, fontFamily: FONT_MONO }}
      className="relative z-10 border-t px-6 py-10 text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)]/55 md:px-12"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Monogram />
          <span>ScopeIQ · a Novabots study</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <a href="/privacy" className="hover:text-[color:var(--ink)]">Privacy</a>
          <a href="/terms" className="hover:text-[color:var(--ink)]">Terms</a>
          <a href="mailto:hello@scopeiq.co" className="hover:text-[color:var(--ink)]">hello@scopeiq.co</a>
          <span className="opacity-50">© 2026</span>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------------------------------------- section marker */

function SectionMarker({ n, label }: { n: string; label: string }) {
  return (
    <div className="col-span-12 md:col-span-2">
      <div
        style={{ fontFamily: FONT_MONO, borderColor: FOG }}
        className="flex items-center gap-3 border-t pt-4 text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink)]/55"
      >
        <span style={{ color: EMBER }}>§{n}</span>
        <span>{label}</span>
      </div>
    </div>
  );
}
