"use client";

/**
 * Sprint 5 — Template Marketplace browser (FEAT-NEW-008).
 *
 * Phase 1 ships with a curated set of seed templates. Selecting "Install"
 * fires a toast and persists the installed state in component memory — the
 * real backend hand-off (POST /v1/brief-templates/install/:slug) lands in
 * Phase 2 once we have community submissions to publish.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import { Card, useToast, cn } from "@novabots/ui";
import {
  MarketplaceCard,
  type MarketplaceTemplate,
} from "@/components/briefs/templates/marketplace-card";

const TEMPLATES: MarketplaceTemplate[] = [
  {
    id: "tpl-brand-identity",
    title: "Brand Identity Sprint",
    category: "Branding",
    description:
      "10-question deep-dive on brand voice, audience, and visual direction. Built for studios doing rapid identity work.",
    installs: 1284,
    curated: true,
    accent: "#F24E1E",
  },
  {
    id: "tpl-website-redesign",
    title: "Website Redesign Brief",
    category: "Web",
    description:
      "Capture goals, KPIs, content audit, and tech constraints upfront so the design phase never stalls.",
    installs: 2031,
    curated: true,
    accent: "#1D9E75",
  },
  {
    id: "tpl-product-launch",
    title: "Product Launch Campaign",
    category: "Marketing",
    description:
      "Positioning, messaging pillars, and channel mix in one structured form. Pairs well with Stripe + Linear.",
    installs: 871,
    accent: "#5E6AD2",
  },
  {
    id: "tpl-ugc-shoot",
    title: "UGC Content Shoot",
    category: "Content",
    description:
      "Brief creators with shot-lists, talent requirements, and usage rights baked in. Reduces revision rounds by 40%.",
    installs: 612,
    accent: "#0D1B2A",
  },
  {
    id: "tpl-mobile-app",
    title: "Mobile App MVP",
    category: "Product",
    description:
      "User flows, monetization model, platform priorities. Built with feedback from 30+ founders shipping their first app.",
    installs: 498,
    curated: true,
    accent: "#635BFF",
  },
  {
    id: "tpl-event-page",
    title: "Event Landing Page",
    category: "Web",
    description:
      "Single-page brief covering speakers, registration, sponsor logos, and post-event analytics.",
    installs: 357,
    accent: "#13B5EA",
  },
];

const CATEGORIES = ["All", "Branding", "Web", "Marketing", "Content", "Product"] as const;
type Category = (typeof CATEGORIES)[number];

export default function TemplateMarketplacePage() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [installingId, setInstallingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    return TEMPLATES.filter((tpl) => {
      if (activeCategory !== "All" && tpl.category !== activeCategory) {
        return false;
      }
      if (
        query &&
        !tpl.title.toLowerCase().includes(query.toLowerCase()) &&
        !tpl.description.toLowerCase().includes(query.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [activeCategory, query]);

  const handleInstall = async (id: string) => {
    setInstallingId(id);
    try {
      // Simulate the API round-trip; replace with `fetchWithAuth` once the
      // backend route is live.
      await new Promise((res) => setTimeout(res, 450));
      setInstalled((prev) => new Set(prev).add(id));
      toast("success", "Template added to your library");
    } catch {
      toast("error", "Couldn't install template — try again");
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/briefs/templates"
            className="mb-2 inline-flex items-center gap-1 text-xs text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text-primary))]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to your library
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#1D9E75]" />
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              Template marketplace
            </h1>
          </div>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Curated and community brief templates — install in one click.
          </p>
        </div>
      </div>

      {/* Search + categories */}
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search marketplace..."
            className="w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#1D9E75]"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeCategory === cat
                  ? "bg-[#1D9E75] text-white"
                  : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]/80",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgb(var(--border-subtle))] py-16">
          <p className="text-sm text-[rgb(var(--text-muted))]">
            No templates match that search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tpl, i) => (
            <MarketplaceCard
              key={tpl.id}
              template={tpl}
              index={i}
              installed={installed.has(tpl.id)}
              installing={installingId === tpl.id}
              onInstall={handleInstall}
            />
          ))}
        </div>
      )}
    </div>
  );
}
