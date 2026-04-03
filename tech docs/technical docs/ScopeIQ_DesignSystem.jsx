import { useState, useEffect } from "react";

const colors = {
  primary: { teal: "#0F6E56", mid: "#1D9E75", light: "#E1F5EE", dark: "#0A5843" },
  status: { red: "#DC2626", redLight: "#FEF2F2", amber: "#D97706", amberLight: "#FEF9C3", green: "#059669", greenLight: "#ECFDF5", blue: "#2563EB", blueLight: "#EFF6FF" },
  neutral: { primary: "#0D1B2A", secondary: "#4B5563", muted: "#9CA3AF", border: "#D1D5DB", borderSubtle: "#E5E7EB", surfaceSubtle: "#F8FAFC", white: "#FFFFFF", code: "#F1F5F9" }
};

const tabs = ["Colors", "Typography", "Components", "Motion", "Screens"];

function AnimatedNumber({ value, duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const interval = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(interval); }
      else setDisplay(Math.round(start));
    }, 16);
    return () => clearInterval(interval);
  }, [value, duration]);
  return <span>{display}</span>;
}

function RevisionCounter({ current, total }) {
  const pct = (current / total) * 100;
  const barColor = pct <= 50 ? colors.status.green : pct <= 80 ? colors.status.amber : colors.status.red;
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: colors.neutral.muted }}>Revision round {current} of {total}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: barColor }}>{total - current} remaining</span>
      </div>
      <div style={{ width: "100%", height: 6, borderRadius: 3, background: colors.neutral.borderSubtle }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: barColor, transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
      </div>
    </div>
  );
}

function ScopeMeter({ percentage }) {
  const barColor = percentage <= 50 ? colors.status.green : percentage <= 80 ? colors.status.amber : colors.status.red;
  const circumference = Math.PI * 80;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="180" height="100" viewBox="0 0 180 100">
        <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke={colors.neutral.borderSubtle} strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke={barColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.3s ease" }} />
        <text x="90" y="72" textAnchor="middle" style={{ fontSize: 28, fontWeight: 700, fill: colors.neutral.primary }}>{percentage}%</text>
        <text x="90" y="90" textAnchor="middle" style={{ fontSize: 11, fontWeight: 400, fill: colors.neutral.muted }}>scope used</text>
      </svg>
    </div>
  );
}

function Badge({ status }) {
  const styles = {
    approved: { bg: colors.status.greenLight, color: colors.status.green, border: colors.status.green },
    "in review": { bg: colors.status.blueLight, color: colors.status.blue, border: colors.status.blue },
    pending: { bg: colors.status.amberLight, color: colors.status.amber, border: colors.status.amber },
    flagged: { bg: colors.status.redLight, color: colors.status.red, border: colors.status.red },
    draft: { bg: colors.neutral.code, color: colors.neutral.secondary, border: colors.neutral.border },
  };
  const s = styles[status] || styles.draft;
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 11, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", background: s.bg, color: s.color, border: `1px solid ${s.border}`, transition: "all 0.2s ease" }}>
      {status}
    </span>
  );
}

function ScopeFlagCard() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return (
    <div style={{ padding: 20, background: colors.status.greenLight, borderRadius: 12, borderLeft: `4px solid ${colors.status.green}`, textAlign: "center", transition: "all 0.3s ease" }}>
      <span style={{ fontSize: 14, color: colors.status.green, fontWeight: 500 }}>✓ Marked as in-scope</span>
    </div>
  );
  return (
    <div style={{ background: colors.status.redLight, borderRadius: 12, borderLeft: `4px solid ${colors.status.red}`, padding: 16, transition: "all 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Badge status="flagged" />
        <span style={{ fontSize: 11, color: colors.neutral.muted }}>Confidence: 82%</span>
      </div>
      <p style={{ fontSize: 13, color: colors.neutral.primary, fontWeight: 500, margin: "0 0 4px 0" }}>Acme Corp — Brand Identity</p>
      <p style={{ fontSize: 12, color: colors.neutral.secondary, margin: "0 0 12px 0", lineHeight: 1.5 }}>
        "Can we also get social media templates in Canva format?"
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ flex: 1, padding: "6px 12px", borderRadius: 6, border: "none", background: colors.status.red, color: "white", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          Send Change Order
        </button>
        <button onClick={() => setDismissed(true)} style={{ flex: 1, padding: "6px 12px", borderRadius: 6, border: `1px solid ${colors.neutral.border}`, background: "white", color: colors.neutral.secondary, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          Mark In-Scope
        </button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, trendUp }) {
  return (
    <div style={{ background: "white", borderRadius: 12, border: `1px solid ${colors.neutral.borderSubtle}`, padding: 20, transition: "all 0.2s ease", cursor: "default" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: colors.neutral.primary }}><AnimatedNumber value={value} /></div>
      <div style={{ fontSize: 12, fontWeight: 500, color: colors.neutral.muted, marginTop: 4 }}>{label}</div>
      {trend && <div style={{ fontSize: 11, fontWeight: 500, color: trendUp ? colors.status.green : colors.status.red, marginTop: 6 }}>{trendUp ? "↑" : "↓"} {trend}</div>}
    </div>
  );
}

export default function DesignSystem() {
  const [activeTab, setActiveTab] = useState("Colors");
  const [revRound, setRevRound] = useState(2);
  const [scopePct, setScopePct] = useState(45);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: colors.neutral.surfaceSubtle, minHeight: "100vh", color: colors.neutral.primary }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: `1px solid ${colors.neutral.borderSubtle}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.primary.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>S</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: colors.neutral.primary }}>ScopeIQ</span>
          <span style={{ fontSize: 12, color: colors.neutral.muted, marginLeft: 4 }}>Design System</span>
        </div>
        <span style={{ fontSize: 11, color: colors.neutral.muted }}>Inspired by Family.co</span>
      </div>

      {/* Tab Navigation */}
      <div style={{ background: "white", borderBottom: `1px solid ${colors.neutral.borderSubtle}`, padding: "0 24px", display: "flex", gap: 0, overflowX: "auto" }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "12px 20px", border: "none", background: "none", fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
            color: activeTab === tab ? colors.primary.teal : colors.neutral.muted,
            borderBottom: activeTab === tab ? `2px solid ${colors.primary.teal}` : "2px solid transparent",
            cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap"
          }}>{tab}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>

        {activeTab === "Colors" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: colors.neutral.primary }}>Color System</h2>
            {[
              { title: "Primary", items: [
                { name: "primary-teal", hex: "#0F6E56", desc: "Buttons, links, active states" },
                { name: "primary-mid", hex: "#1D9E75", desc: "Hover, badges, focus rings" },
                { name: "primary-light", hex: "#E1F5EE", desc: "Info banners, tag fills" },
                { name: "primary-dark", hex: "#0A5843", desc: "Active/pressed states" },
              ]},
              { title: "Status", items: [
                { name: "status-red", hex: "#DC2626", desc: "Scope flags, errors" },
                { name: "status-amber", hex: "#D97706", desc: "Warnings, approaching limits" },
                { name: "status-green", hex: "#059669", desc: "Approvals, success" },
                { name: "status-blue", hex: "#2563EB", desc: "In-progress, informational" },
              ]},
              { title: "Neutrals", items: [
                { name: "text-primary", hex: "#0D1B2A", desc: "Headings, labels" },
                { name: "text-secondary", hex: "#4B5563", desc: "Body text" },
                { name: "text-muted", hex: "#9CA3AF", desc: "Placeholders, timestamps" },
                { name: "surface-subtle", hex: "#F8FAFC", desc: "Page backgrounds" },
              ]},
            ].map(group => (
              <div key={group.title} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{group.title}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {group.items.map(c => (
                    <div key={c.name} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${colors.neutral.borderSubtle}`, background: "white" }}>
                      <div style={{ height: 56, background: c.hex }} />
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: colors.neutral.primary }}>{c.name}</div>
                        <div style={{ fontSize: 11, fontFamily: "monospace", color: colors.neutral.muted }}>{c.hex}</div>
                        <div style={{ fontSize: 11, color: colors.neutral.secondary, marginTop: 4 }}>{c.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Typography" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Typography Scale</h2>
            {[
              { name: "Display", size: 32, weight: 700, sample: "Welcome to ScopeIQ" },
              { name: "Heading 1", size: 24, weight: 600, sample: "Project Dashboard" },
              { name: "Heading 2", size: 20, weight: 600, sample: "Active Scope Flags" },
              { name: "Heading 3", size: 16, weight: 600, sample: "Deliverable Status" },
              { name: "Body Large", size: 16, weight: 400, sample: "ScopeIQ protects your revenue with AI-powered scope enforcement." },
              { name: "Body Default", size: 14, weight: 400, sample: "Your brief has been scored at 87/100. All clarity checks passed." },
              { name: "Body Small", size: 12, weight: 400, sample: "Last updated 2 hours ago · Project ID: PRJ-001" },
              { name: "Label", size: 11, weight: 500, sample: "APPROVED · IN REVIEW · PENDING" },
            ].map(t => (
              <div key={t.name} style={{ marginBottom: 20, padding: 16, background: "white", borderRadius: 10, border: `1px solid ${colors.neutral.borderSubtle}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: colors.primary.teal, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.name}</span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: colors.neutral.muted }}>{t.size}px / {t.weight}</span>
                </div>
                <div style={{ fontSize: t.size, fontWeight: t.weight, color: colors.neutral.primary, lineHeight: 1.4 }}>{t.sample}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Components" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Component Library</h2>
            
            {/* Buttons */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Buttons</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: 20, background: "white", borderRadius: 10, border: `1px solid ${colors.neutral.borderSubtle}` }}>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: colors.primary.teal, color: "white", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Primary</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${colors.primary.teal}`, background: "white", color: colors.primary.teal, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Secondary</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: colors.status.red, color: "white", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Danger</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "transparent", color: colors.neutral.secondary, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Ghost</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: colors.primary.teal, color: "white", fontSize: 14, fontWeight: 500, opacity: 0.5, cursor: "not-allowed" }}>Disabled</button>
              </div>
            </div>

            {/* Badges */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status Badges</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: 20, background: "white", borderRadius: 10, border: `1px solid ${colors.neutral.borderSubtle}` }}>
                {["approved", "in review", "pending", "flagged", "draft"].map(s => <Badge key={s} status={s} />)}
              </div>
            </div>

            {/* Metric Cards */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Metric Cards</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                <MetricCard label="Active Projects" value={12} trend="2 this week" trendUp />
                <MetricCard label="Awaiting Approval" value={4} />
                <MetricCard label="Scope Flags" value={2} trend="Urgent" trendUp={false} />
                <MetricCard label="Monthly Revenue" value={8400} trend="12% MoM" trendUp />
              </div>
            </div>

            {/* Revision Counter */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Revision Counter (Interactive)</h3>
              <div style={{ padding: 20, background: "white", borderRadius: 10, border: `1px solid ${colors.neutral.borderSubtle}` }}>
                <RevisionCounter current={revRound} total={4} />
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => setRevRound(Math.max(0, revRound - 1))} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${colors.neutral.border}`, background: "white", fontSize: 12, cursor: "pointer" }}>- Round</button>
                  <button onClick={() => setRevRound(Math.min(4, revRound + 1))} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: colors.primary.teal, color: "white", fontSize: 12, cursor: "pointer" }}>+ Round</button>
                </div>
              </div>
            </div>

            {/* Scope Meter */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Scope Meter (Interactive)</h3>
              <div style={{ padding: 20, background: "white", borderRadius: 10, border: `1px solid ${colors.neutral.borderSubtle}`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ScopeMeter percentage={scopePct} />
                <input type="range" min="0" max="100" value={scopePct} onChange={e => setScopePct(Number(e.target.value))}
                  style={{ width: 200, marginTop: 12, accentColor: colors.primary.teal }} />
                <span style={{ fontSize: 11, color: colors.neutral.muted, marginTop: 4 }}>Drag to preview scope states</span>
              </div>
            </div>

            {/* Scope Flag Card */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Scope Flag Card (Interactive)</h3>
              <div style={{ maxWidth: 400 }}>
                <ScopeFlagCard />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Motion" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Motion Design Tokens</h2>
            {[
              { name: "spring-snappy", value: "stiffness: 500, damping: 30", use: "Button presses, toggle switches, badge morphs", dur: "~0.15s" },
              { name: "spring-smooth", value: "stiffness: 300, damping: 25", use: "Card expansions, panel slides, modal entrances", dur: "~0.3s" },
              { name: "spring-gentle", value: "stiffness: 200, damping: 20", use: "Page transitions, section reveals on scroll", dur: "~0.5s" },
              { name: "ease-out", value: "duration: 0.2s, ease: [0,0,0.2,1]", use: "Hover states, focus rings, opacity changes", dur: "0.2s" },
              { name: "stagger-fast", value: "delay: 0.05s, stagger: 0.03s", use: "List item reveals (scope flags, deliverables)", dur: "varies" },
              { name: "stagger-slow", value: "delay: 0.1s, stagger: 0.08s", use: "Dashboard card entrance on page load", dur: "varies" },
              { name: "exit-quick", value: "duration: 0.15s, ease-in", use: "Dismissals, card removals, resolved pins", dur: "0.15s" },
            ].map((m, i) => (
              <div key={m.name} style={{ marginBottom: 12, padding: 16, background: "white", borderRadius: 10, border: `1px solid ${colors.neutral.borderSubtle}`, display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ minWidth: 130 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.primary.teal, fontFamily: "monospace" }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: colors.neutral.muted, marginTop: 2 }}>{m.dur}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: colors.neutral.secondary }}>{m.use}</div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: colors.neutral.muted, marginTop: 4 }}>{m.value}</div>
                </div>
              </div>
            ))}

            <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginTop: 28, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Family.co-Inspired Interaction Mapping</h3>
            {[
              { scopeiq: "Scope flag slides in", family: "Wallet notification slide-in" },
              { scopeiq: "Revision counter odometer roll", family: "Price chart number animation" },
              { scopeiq: "Brief score circular reveal", family: "Asset value counter" },
              { scopeiq: "Deliverable approval checkmark draw", family: "Successful transfer animation" },
              { scopeiq: "Dashboard card stagger entrance", family: "Home screen asset list load" },
              { scopeiq: "Portal tab cross-fade", family: "Feature tab switching" },
              { scopeiq: "Drag-and-drop brief field lift", family: "NFT sorting drag interaction" },
            ].map(m => (
              <div key={m.scopeiq} style={{ display: "flex", marginBottom: 8, fontSize: 13 }}>
                <span style={{ flex: 1, color: colors.neutral.primary, fontWeight: 500 }}>{m.scopeiq}</span>
                <span style={{ color: colors.neutral.muted, margin: "0 12px" }}>←</span>
                <span style={{ flex: 1, color: colors.neutral.secondary, fontStyle: "italic" }}>{m.family}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Screens" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Screen Architecture</h2>
            
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Agency Dashboard</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {["Dashboard Overview", "Projects List", "Project Detail (5 tabs)", "Brief Builder", "Scope Flag Detail", "Change Order View", "Settings & Billing"].map(s => (
                  <div key={s} style={{ padding: 16, background: "white", borderRadius: 10, border: `1px solid ${colors.neutral.borderSubtle}`, fontSize: 13, fontWeight: 500, color: colors.neutral.primary }}>
                    <div style={{ width: "100%", height: 4, borderRadius: 2, background: colors.primary.light, marginBottom: 10 }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Client Portal</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {["Brief Submission (4 steps)", "Deliverable Review", "Annotation Mode", "Change Order View", "Approval Confirmation"].map(s => (
                  <div key={s} style={{ padding: 16, background: "white", borderRadius: 10, border: `1px solid ${colors.primary.mid}33`, fontSize: 13, fontWeight: 500, color: colors.neutral.primary }}>
                    <div style={{ width: "100%", height: 4, borderRadius: 2, background: colors.primary.teal, marginBottom: 10 }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.neutral.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Marketing Site (Family.co Layout)</h3>
              {["Hero — Full viewport, bold headline, dual CTAs", "Feature Bento Grid — 3 modules with animated previews", "How It Works — Horizontal 3-step flow", "Social Proof Marquee — Infinite scroll testimonials", "Feature Deep-Dives — Alternating left/right sections", "Pricing — 3-tier table with toggle", "FAQ Accordion — Expandable Q&A", "Final CTA — Clean full-width banner"].map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, padding: "10px 14px", background: "white", borderRadius: 8, border: `1px solid ${colors.neutral.borderSubtle}` }}>
                  <span style={{ width: 24, height: 24, borderRadius: 12, background: colors.primary.light, color: colors.primary.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: colors.neutral.primary }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
