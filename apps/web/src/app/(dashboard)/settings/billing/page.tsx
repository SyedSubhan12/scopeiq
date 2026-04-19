"use client";

import { Check, Zap, AlertTriangle } from "lucide-react";
import { Button, Card, useToast } from "@novabots/ui";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { cn } from "@novabots/ui";
import { MultiWorkspacePlanCard } from "@/components/billing/MultiWorkspacePlanCard";

type Plan = "solo" | "studio" | "agency";

const PLANS: {
  id: Plan;
  name: string;
  price: string;
  description: string;
  features: { label: string; included: boolean }[];
  highlight?: boolean;
}[] = [
  {
    id: "solo",
    name: "Solo",
    price: "Free",
    description: "For freelancers getting started",
    features: [
      { label: "Up to 3 projects", included: true },
      { label: "1 team member", included: true },
      { label: "AI brief scoring", included: true },
      { label: "Client portal", included: true },
      { label: "White-label portal", included: false },
      { label: "Custom brand color", included: false },
      { label: "Unlimited projects", included: false },
      { label: "Up to 5 team members", included: false },
    ],
  },
  {
    id: "studio",
    name: "Studio",
    price: "$49/mo",
    description: "For growing studios",
    highlight: true,
    features: [
      { label: "Up to 15 projects", included: true },
      { label: "Up to 5 team members", included: true },
      { label: "AI brief scoring", included: true },
      { label: "Client portal", included: true },
      { label: "White-label portal", included: true },
      { label: "Custom brand color", included: true },
      { label: "Unlimited projects", included: false },
      { label: "Unlimited team members", included: false },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "$99/mo",
    description: "For scaling agencies",
    features: [
      { label: "Unlimited projects", included: true },
      { label: "Unlimited team members", included: true },
      { label: "AI brief scoring", included: true },
      { label: "Client portal", included: true },
      { label: "White-label portal", included: true },
      { label: "Custom brand color", included: true },
      { label: "Priority support", included: true },
      { label: "API access", included: true },
    ],
  },
];

export default function BillingPage() {
  const currentPlan = useWorkspaceStore((s) => s.plan);
  const { toast } = useToast();

  const handleUpgrade = (planId: Plan) => {
    toast("info", "Billing coming soon — upgrade not available yet.");
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Billing & Plan</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Manage your subscription and usage limits
        </p>
      </div>

      {/* Current plan banner */}
      <Card className="flex items-center justify-between p-4 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              You are on the <span className="capitalize">{currentPlan}</span> plan
            </p>
            <p className="text-xs text-[rgb(var(--text-muted))]">
              {currentPlan === "solo"
                ? "Upgrade to unlock white-label portals and more projects."
                : currentPlan === "studio"
                ? "Upgrade to Agency for unlimited projects and team members."
                : "You have access to all features."}
            </p>
          </div>
        </div>
        {currentPlan !== "agency" && (
          <Button size="sm" onClick={() => handleUpgrade("agency")}>
            <Zap className="mr-1.5 h-3.5 w-3.5 fill-current" />
            Upgrade
          </Button>
        )}
      </Card>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border-2 bg-white p-6 transition-shadow",
                isCurrent
                  ? "border-primary shadow-md shadow-primary/10"
                  : plan.highlight
                  ? "border-[rgb(var(--border-default))] shadow-sm"
                  : "border-[rgb(var(--border-default))]",
              )}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                  Current plan
                </span>
              )}
              {plan.highlight && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-semibold text-white">
                  Popular
                </span>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">{plan.name}</h3>
                <p className="text-2xl font-bold text-primary">{plan.price}</p>
                <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{plan.description}</p>
              </div>

              <ul className="mb-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <Check
                      className={cn("h-4 w-4 shrink-0", f.included ? "text-emerald-500" : "text-[rgb(var(--border-default))]")}
                    />
                    <span className={f.included ? "text-[rgb(var(--text-primary))]" : "text-[rgb(var(--text-muted))]"}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button size="sm" variant="secondary" className="w-full" disabled>
                  Current plan
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  variant={plan.highlight ? "primary" : "secondary"}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  Upgrade to {plan.name}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Multi-workspace add-on (FEAT-NEW-011) */}
      <MultiWorkspacePlanCard />

      {/* Billing info note */}
      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Billing is not yet active. Upgrade buttons are placeholders — all features are currently
          available during the beta period.
        </p>
      </Card>
    </div>
  );
}
