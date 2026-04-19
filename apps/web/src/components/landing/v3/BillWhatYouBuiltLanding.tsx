"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValue, animate, useInView } from "framer-motion";
import Link from "next/link";

/* ============================================================================
   ScopeIQ — "Bill what you built."
   Editorial minimalism. Swiss grid. Serif display + mono accents.
   Paper / Ink / Moss / Ember.
   ============================================================================ */

const FONT_DISPLAY = "var(--font-serif), 'Fraunces', 'Iowan Old Style', Georgia, serif";
const FONT_BODY = "var(--font-body-alt), 'IBM Plex Sans', system-ui, sans-serif";
const FONT_MONO = "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace";

const PAPER = "#F2EFE6";
const INK = "#0B0B0B";
const MOSS = "#1A6E4B";
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
  return (
    <header className="relative z-40 px-6 pt-6 md:px-12 md:pt-8">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between">
        <div className="flex items-center gap-3">
          <Monogram />
          <span
            style={{ fontFamily: FONT_MONO }}
            className="text-[11px] uppercase tracking-[0.22em] text-ink/60"
          >
            ScopeIQ · est. 2026
          </span>
        </div>

        <nav
          style={{ fontFamily: FONT_MONO }}
          className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.22em] md:flex"
        >
          <a href="#leak" className="hover:text-[color:var(--ember)]">§01 · Leak</a>
          <a href="#how" className="hover:text-[color:var(--ember)]">§02 · Method</a>
          <a href="#live" className="hover:text-[color:var(--ember)]">§03 · Live</a>
          <a href="#proof" className="hover:text-[color:var(--ember)]">§04 · Proof</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            style={{ fontFamily: FONT_MONO }}
            className="hidden rounded-full border border-[#0B0B0B]/15 px-4 py-2 text-[11px] uppercase tracking-[0.22em] hover:border-[#0B0B0B] md:inline-block"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            style={{ fontFamily: FONT_MONO, background: INK, color: PAPER }}
            className="rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.22em] transition hover:opacity-90"
          >
            Start billing →
          </Link>
        </div>
      </div>
    </header>
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

/* ------------------------------------------------------------------- hero */

function Hero() {
  const words = ["Bill", "what", "you", "built."];
  return (
    <section className="relative z-10 px-6 pt-16 md:px-12 md:pt-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
        {/* left rail */}
        <div className="col-span-12 md:col-span-2">
          <div
            style={{ fontFamily: FONT_MONO }}
            className="mb-8 text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)]/55"
          >
            §00 / Thesis
            <br />
            Vol. I — 2026
          </div>
        </div>

        {/* headline */}
        <div className="col-span-12 md:col-span-10">
          <h1
            style={{ fontFamily: FONT_DISPLAY, fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
            className="relative font-light leading-[0.92] tracking-[-0.02em] text-[clamp(3.5rem,11vw,10.5rem)]"
          >
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08 * i + 0.15, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                className="inline-block overflow-hidden pr-[0.28em]"
              >
                <span
                  className={i === 0 ? "italic" : i === 3 ? "relative" : ""}
                  style={i === 0 ? { color: INK } : {}}
                >
                  {w}
                  {i === 3 && <UnderMeasure />}
                </span>
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-10 grid max-w-5xl grid-cols-12 gap-6"
          >
            <p className="col-span-12 text-[clamp(1rem,1.35vw,1.25rem)] leading-[1.55] text-[color:var(--ink)]/80 md:col-span-7">
              ScopeIQ catches every vague brief before work starts, flags every out-of-scope
              request the moment a client types it, and converts the silent revisions you used
              to absorb into signed change orders.
              <span className="block pt-3 text-[color:var(--ink)]/55">
                Written for creative studios that are tired of eating the difference.
              </span>
            </p>

            <div className="col-span-12 md:col-span-5 md:pl-8">
              <div
                style={{ borderLeft: `1px solid ${FOG}` }}
                className="space-y-3 pl-6"
              >
                <Stat label="Avg. revenue recovered" value="17.8%" />
                <Stat label="Scope creep caught in" value="4.2s" />
                <Stat label="Briefs upgraded past 75 clarity" value="83%" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.7 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/register"
              style={{ background: INK, color: PAPER, fontFamily: FONT_MONO }}
              className="group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-[12px] uppercase tracking-[0.2em] transition hover:-translate-y-[1px]"
            >
              Start billing
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
      </div>
    </section>
  );
}

function UnderMeasure() {
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
        stroke={EMBER}
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
          stroke={EMBER}
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
