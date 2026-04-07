"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Paintbrush2, Sparkles, Workflow } from "lucide-react";
import { Button, Card, Input, Textarea } from "@novabots/ui";
import { generatePortalTheme } from "@/lib/portal-theme";
import {
  type BriefTemplateBrandingRecord,
  type BriefTemplateVersionRecord,
  type SaveState,
} from "@/lib/briefs";

type TemplateBrandingPanelProps = {
  workspaceName: string;
  workspaceLogoUrl?: string | null;
  workspaceBrandColor: string;
  templateName: string;
  templateDescription: string;
  templateBranding?: BriefTemplateBrandingRecord | null;
  publishedVersionBranding?: BriefTemplateVersionRecord["branding"];
  onBrandingChange?: (branding: BriefTemplateBrandingRecord) => void;
  onSave?: () => void | Promise<void>;
  saveState?: SaveState;
};

function effectiveValue(candidate: string | null | undefined, fallback: string) {
  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate : fallback;
}

export function TemplateBrandingPanel({
  workspaceName,
  workspaceLogoUrl,
  workspaceBrandColor,
  templateName,
  templateDescription,
  templateBranding,
  publishedVersionBranding,
  onBrandingChange,
  onSave,
  saveState = "idle",
}: TemplateBrandingPanelProps) {
  const effectiveBranding = templateBranding ?? publishedVersionBranding ?? null;
  const effectiveColor = effectiveValue(effectiveBranding?.accentColor, workspaceBrandColor);
  const effectiveTheme = useMemo(() => generatePortalTheme(effectiveColor), [effectiveColor]);
  const sourceLabel = templateBranding ? "template override" : publishedVersionBranding ? "published snapshot" : "workspace defaults";
  const normalizedBranding: BriefTemplateBrandingRecord = {
    logoUrl: templateBranding?.logoUrl ?? null,
    accentColor: templateBranding?.accentColor ?? null,
    introMessage: templateBranding?.introMessage ?? null,
    successMessage: templateBranding?.successMessage ?? null,
    supportEmail: templateBranding?.supportEmail ?? null,
    source: templateBranding?.source ?? null,
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
      <Card className="rounded-[28px] p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <Paintbrush2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Branding preview</h2>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              The template currently uses {sourceLabel}. Edit template-specific copy and visual overrides here, or leave fields blank to inherit the workspace defaults.
            </p>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-[28px] border border-[rgb(var(--border-subtle))]"
          style={{
            background: `linear-gradient(180deg, rgba(${effectiveTheme["--portal-primary-light"]},0.56) 0%, rgba(255,255,255,1) 58%)`,
          }}
        >
          <div className="border-b border-[rgb(var(--border-subtle))] bg-white/80 px-6 py-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Effective portal branding</p>
                <p className="mt-3 font-semibold text-[rgb(var(--text-primary))]">{workspaceName}</p>
                <p className="text-sm text-[rgb(var(--text-secondary))]">{templateName}</p>
              </div>
              <span
                className="h-10 w-10 rounded-2xl border border-white/70 shadow-sm"
                style={{ backgroundColor: effectiveColor }}
                aria-label={`Effective brand color ${effectiveColor}`}
              />
            </div>
          </div>

          <div className="space-y-4 px-6 py-6">
            <div className="rounded-3xl bg-white px-5 py-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.32)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Intro message</p>
              <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--text-primary))]">
                {effectiveBranding?.introMessage || `Help us start ${templateName || "this project"} with the right scope`}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">
                {templateDescription?.trim()
                  ? templateDescription
                  : "This preview keeps the client experience focused on clarity, references, and the details needed before work begins."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Accent color"
                value={effectiveColor}
                note={normalizedBranding.accentColor ? "Template override" : "Inherited from workspace"}
              />
              <MetricCard
                label="Support email"
                value={effectiveBranding?.supportEmail || "Workspace default"}
                note={normalizedBranding.supportEmail ? "Template override" : "Inherited from workspace"}
              />
              <MetricCard
                label="Success state"
                value={effectiveBranding?.successMessage || "Your brief has been submitted and is ready for review."}
                note="What clients see after sending the brief"
                fullWidth
              />
            </div>

            <div className="rounded-2xl bg-white px-4 py-4 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.28)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Backend-ready override state</p>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                {templateBranding && Object.values(templateBranding).some((value) => value)
                  ? "A template-specific branding override is present and will be used as the effective portal theme."
                  : "No template-specific override is present yet. The template inherits workspace branding until a backend override arrives."}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-[28px] p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--surface-subtle))]">
              <Workflow className="h-4 w-4 text-[rgb(var(--text-muted))]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Workspace defaults</p>
              <p className="text-sm text-[rgb(var(--text-secondary))]">What the template inherits if no override exists</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm text-[rgb(var(--text-secondary))]">
            <DetailRow label="Logo" value={workspaceLogoUrl ? "Workspace or template logo URL configured" : "No logo configured"} />
            <DetailRow label="Brand color" value={workspaceBrandColor} />
            <DetailRow label="Intro message" value={`Help us start ${templateName || "this project"} with the right scope`} />
            <DetailRow label="Support" value="Workspace contact settings" />
          </div>
        </Card>

        <Card className="rounded-[28px] p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
              <Sparkles className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Template override readiness</p>
              <p className="text-sm text-[rgb(var(--text-secondary))]">Template-level overrides are live. Leave any field empty to inherit the workspace default instead.</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <Input
              label="Logo URL"
              value={normalizedBranding.logoUrl ?? ""}
              placeholder="https://cdn.example.com/logo.svg"
              onChange={(event) =>
                onBrandingChange?.({
                  ...normalizedBranding,
                  logoUrl: event.target.value || null,
                })
              }
            />

            <Input
              label="Accent color"
              value={normalizedBranding.accentColor ?? ""}
              placeholder={workspaceBrandColor}
              onChange={(event) =>
                onBrandingChange?.({
                  ...normalizedBranding,
                  accentColor: event.target.value || null,
                })
              }
            />

            <Textarea
              label="Intro message"
              rows={4}
              value={normalizedBranding.introMessage ?? ""}
              placeholder={`Help us start ${templateName || "this project"} with the right scope`}
              onChange={(event) =>
                onBrandingChange?.({
                  ...normalizedBranding,
                  introMessage: event.target.value || null,
                })
              }
            />

            <Textarea
              label="Success message"
              rows={3}
              value={normalizedBranding.successMessage ?? ""}
              placeholder="Your brief has been submitted and is ready for review."
              onChange={(event) =>
                onBrandingChange?.({
                  ...normalizedBranding,
                  successMessage: event.target.value || null,
                })
              }
            />

            <Input
              label="Support email"
              type="email"
              value={normalizedBranding.supportEmail ?? ""}
              placeholder="support@example.com"
              onChange={(event) =>
                onBrandingChange?.({
                  ...normalizedBranding,
                  supportEmail: event.target.value || null,
                })
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/settings/workspace">
              <Button variant="secondary">Open workspace branding</Button>
            </Link>
            <Button variant="ghost" onClick={() => void onSave?.()}>
              {saveState === "saving" ? "Saving..." : "Save branding"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  fullWidth,
}: {
  label: string;
  value: string;
  note: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`rounded-2xl bg-white px-4 py-4 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.28)] ${fullWidth ? "sm:col-span-2" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[rgb(var(--text-primary))]">{value}</p>
      <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{note}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[rgb(var(--surface-subtle))] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">{label}</p>
      <p className="mt-1 text-[rgb(var(--text-primary))]">{value}</p>
    </div>
  );
}
