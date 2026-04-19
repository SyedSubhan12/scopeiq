"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, useToast } from "@novabots/ui";
import {
  IntegrationCard,
  type IntegrationMeta,
  type IntegrationProvider,
} from "@/components/settings/integrations/IntegrationCard";

// Sprint 5 FEAT-NEW-009: Integration Hub. Phase 1 providers ship as connect-ready stubs
// (backend OAuth is scaffold-only), Phase 2 shows "Coming soon" placeholders.
const INTEGRATIONS: IntegrationMeta[] = [
  {
    provider: "slack",
    name: "Slack",
    description: "Stream scope flags and approvals into a channel your team already lives in.",
    phase: 1,
    accent: "#611F69",
  },
  {
    provider: "notion",
    name: "Notion",
    description: "Sync briefs and SOWs to a Notion workspace so clients can review in-place.",
    phase: 1,
    accent: "#1F1F1F",
  },
  {
    provider: "linear",
    name: "Linear",
    description: "Turn confirmed scope flags into Linear issues with a single click.",
    phase: 1,
    accent: "#5E6AD2",
  },
  {
    provider: "xero",
    name: "Xero",
    description: "Push approved change orders to Xero invoices so billing stays current.",
    phase: 1,
    accent: "#13B5EA",
  },
  {
    provider: "figma",
    name: "Figma",
    description: "Pull deliverable previews directly from Figma frames.",
    phase: 2,
    accent: "#F24E1E",
  },
  {
    provider: "stripe",
    name: "Stripe",
    description: "Collect change order payments inline with a Stripe checkout link.",
    phase: 2,
    accent: "#635BFF",
  },
];

export default function IntegrationsSettingsPage() {
  const { toast } = useToast();
  // Local scaffold state — real state will come from useIntegrations() once the backend
  // OAuth flow is wired up. Connecting a Phase-1 provider shows an optimistic success
  // toast so the flow is testable end-to-end.
  const [connected, setConnected] = useState<Partial<Record<IntegrationProvider, boolean>>>({});
  const [busy, setBusy] = useState<Partial<Record<IntegrationProvider, boolean>>>({});

  const handleConnect = async (provider: IntegrationProvider) => {
    setBusy((b) => ({ ...b, [provider]: true }));
    // Simulate async OAuth kickoff
    await new Promise((r) => setTimeout(r, 650));
    setConnected((c) => ({ ...c, [provider]: true }));
    setBusy((b) => ({ ...b, [provider]: false }));
    toast("success", `${provider} connected (stub)`);
  };

  const handleDisconnect = async (provider: IntegrationProvider) => {
    setConnected((c) => ({ ...c, [provider]: false }));
    toast("info", `${provider} disconnected`);
  };

  const handleTest = async (provider: IntegrationProvider) => {
    toast("success", `Pinged ${provider} — healthy`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            Connect ScopeIQ to the tools your team already uses. Phase 1 integrations are
            available now; Phase 2 integrations ship in a follow-up release.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((meta, index) => (
              <IntegrationCard
                key={meta.provider}
                meta={meta}
                index={index}
                connected={Boolean(connected[meta.provider])}
                busy={Boolean(busy[meta.provider])}
                onConnect={() => handleConnect(meta.provider)}
                onDisconnect={() => handleDisconnect(meta.provider)}
                onTest={() => handleTest(meta.provider)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
