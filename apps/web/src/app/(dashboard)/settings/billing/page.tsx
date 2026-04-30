"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Zap, Loader2 } from "lucide-react";
import { Button, Card, useToast } from "@novabots/ui";
import { cn } from "@novabots/ui";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { fetchWithAuth } from "@/lib/api";
import { MultiWorkspacePlanCard } from "@/components/billing/MultiWorkspacePlanCard";
import { useEffect } from "react";

type PlanTier = "free" | "solo" | "studio" | "agency";

interface PlanConfig {
  id: PlanTier;
  name: string;
  monthlyPrice: string;
  takeRate: string;
  takeRateLabel: string;
  description: string;
  features: { label: string; included: boolean }[];
  highlight?: boolean;
  upgradeable: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: "$0/mo",
    takeRate: "4%",
    takeRateLabel: "+ 4% of accepted change orders",
    description: "For freelancers getting started",
    upgradeable: false,
    features: [
      { label: "1 user", included: true },
      { label: "Up to 3 clients", included: true },
      { label: "AI brief scoring", included: true },
      { label: "Client portal", included: true },
      { label: "White-label portal", included: false },
      { label: "Custom domain", included: false },
      { label: "Up to 5 users", included: false },
      { label: "API access", included: false },
    ],
  },
  {
    id: "studio",
    name: "Studio",
    monthlyPrice: "$49/mo",
    takeRate: "3%",
    takeRateLabel: "+ 3% take-rate",
    description: "For growing studios",
    highlight: true,
    upgradeable: true,
    features: [
      { label: "Up to 5 users", included: true },
      { label: "Up to 20 clients", included: true },
      { label: "AI brief scoring", included: true },
      { label: "Client portal", included: true },
      { label: "White-label portal", included: true },
      { label: "Custom domain", included: true },
      { label: "Unlimited clients", included: false },
      { label: "API access", included: false },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: "$99/mo",
    takeRate: "2.5%",
    takeRateLabel: "+ 2.5% take-rate",
    description: "For scaling agencies",
    upgradeable: true,
    features: [
      { label: "Unlimited users", included: true },
      { label: "Unlimited clients", included: true },
      { label: "AI brief scoring", included: true },
      { label: "Client portal", included: true },
      { label: "White-label portal", included: true },
      { label: "Custom domain", included: true },
      { label: "API access", included: true },
      { label: "Slack integration", included: true },
      { label: "Priority support", included: true },
    ],
  },
];

function getCurrentPlanBannerText(plan: PlanTier): string {
  if (plan === "free" || plan === "solo") {
    return "You are on the Free plan — 4% take-rate on accepted change orders. No monthly fee.";
  }
  if (plan === "studio") {
    return "You're on Studio — $49/mo + 3% take-rate. Click 'Manage Subscription' to update payment.";
  }
  return "You're on Agency — $99/mo + 2.5% take-rate.";
}

export default function BillingPage() {
  const currentPlan = useWorkspaceStore((s) => s.plan);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [upgrading, setUpgrading] = useState<"studio" | "agency" | null>(null);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast("success", "You've been upgraded! Your new plan is active.");
      router.replace("/settings/billing");
    }
  }, [searchParams, toast, router]);

  const handleUpgrade = async (planTier: "studio" | "agency") => {
    setUpgrading(planTier);
    try {
      const successUrl = `${window.location.origin}/settings/billing?upgraded=true`;
      const cancelUrl = window.location.href;
      const res = await fetchWithAuth.post<{ data: { url: string } }>("/v1/billing/checkout", {
        planTier,
        successUrl,
        cancelUrl,
      });
      window.location.href = res.data.data.url;
    } catch {
      toast("error", "Failed to start checkout. Please try again.");
      setUpgrading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetchWithAuth.post<{ data: { url: string } }>("/v1/billing/portal", {
        returnUrl: window.location.href,
      });
      window.location.href = res.data.data.url;
    } catch {
      toast("error", "Failed to open billing portal.");
    }
  };

  const isSubscribed = currentPlan === "studio" || currentPlan === "agency";
  // Treat legacy "solo" as "free" for display purposes
  const effectivePlan: PlanTier = currentPlan === "solo" ? "free" : currentPlan;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Billing & Plan</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Manage your subscription and usage limits
        </p>
      </div>

      {/* Current plan banner */}
      <Card className="flex items-center justify-between gap-4 p-4 border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))]">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 shrink-0 text-[rgb(var(--primary))]" />
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {getCurrentPlanBannerText(currentPlan)}
          </p>
        </div>
        {isSubscribed && (
          <Button size="sm" variant="secondary" onClick={handleManageSubscription}>
            Manage Subscription
          </Button>
        )}
      </Card>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === effectivePlan;
          const isUpgrading = upgrading === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border-2 bg-[rgb(var(--surface-subtle))] p-6 transition-shadow",
                isCurrent
                  ? "border-[rgb(var(--primary))] shadow-md shadow-primary/10"
                  : plan.highlight
                  ? "border-[rgb(var(--border-default))] shadow-sm"
                  : "border-[rgb(var(--border-subtle))]",
              )}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[rgb(var(--primary))] px-3 py-0.5 text-xs font-semibold text-white">
                  Current plan
                </span>
              )}
              {plan.highlight && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[rgb(var(--primary-mid))] px-3 py-0.5 text-xs font-semibold text-white">
                  Popular
                </span>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">{plan.name}</h3>
                <p className="text-3xl font-bold text-[rgb(var(--text-primary))]">
                  {plan.monthlyPrice}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[rgb(var(--primary))]">
                  {plan.takeRateLabel}
                </p>
                <p className="mt-1.5 text-xs text-[rgb(var(--text-muted))]">{plan.description}</p>
              </div>

              <ul className="mb-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        f.included
                          ? "text-[rgb(var(--status-green))]"
                          : "text-[rgb(var(--border-default))]",
                      )}
                    />
                    <span
                      className={
                        f.included
                          ? "text-[rgb(var(--text-primary))]"
                          : "text-[rgb(var(--text-muted))]"
                      }
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button size="sm" variant="secondary" className="w-full" disabled>
                  Current plan
                </Button>
              ) : plan.upgradeable ? (
                <Button
                  size="sm"
                  className="w-full"
                  variant={plan.highlight ? "primary" : "secondary"}
                  disabled={upgrading !== null}
                  onClick={() => handleUpgrade(plan.id as "studio" | "agency")}
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Multi-workspace add-on */}
      <MultiWorkspacePlanCard />
    </div>
  );
}
