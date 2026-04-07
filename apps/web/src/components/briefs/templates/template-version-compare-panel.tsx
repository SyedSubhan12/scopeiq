"use client";

import { useMemo } from "react";
import { GitCompareArrows, Minus, Plus, RotateCcw, Workflow } from "lucide-react";
import { Button, Card } from "@novabots/ui";
import { type BriefField, type BriefTemplateVersion } from "@/hooks/useBriefTemplates";

type FieldSnapshot = {
  key: string;
  label: string;
  type: BriefField["type"];
  required: boolean;
  placeholder: string | null;
  helpText: string | null;
  options: string[];
  conditions?: BriefField["conditions"];
  order: number;
};

type TemplateVersionComparePanelProps = {
  draft: {
    name: string;
    description: string;
    isDefault: boolean;
    fields: BriefField[];
  };
  latestPublishedVersion: BriefTemplateVersion | null;
  onRestoreVersion?: (versionId: string, versionNumber: number) => void | Promise<void>;
  restorePending?: boolean;
};

function toSnapshot(field: BriefField): FieldSnapshot {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder ?? null,
    helpText: field.helpText ?? null,
    options: field.options ?? [],
    conditions: field.conditions ?? [],
    order: field.order,
  };
}

function diffField(before: FieldSnapshot, after: FieldSnapshot) {
  const changes: string[] = [];
  if (before.label !== after.label) changes.push("label");
  if (before.type !== after.type) changes.push("type");
  if (before.required !== after.required) changes.push("required");
  if (before.placeholder !== after.placeholder) changes.push("placeholder");
  if (before.helpText !== after.helpText) changes.push("helper text");
  if (JSON.stringify(before.options) !== JSON.stringify(after.options)) changes.push("options");
  if (JSON.stringify(before.conditions) !== JSON.stringify(after.conditions)) changes.push("conditions");
  if (before.order !== after.order) changes.push("order");
  return changes;
}

export function TemplateVersionComparePanel({
  draft,
  latestPublishedVersion,
  onRestoreVersion,
  restorePending,
}: TemplateVersionComparePanelProps) {
  const diff = useMemo(() => {
    if (!latestPublishedVersion) return null;

    const draftSignature = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      isDefault: draft.isDefault,
      fields: draft.fields.map(toSnapshot),
    };
    const publishedSignature = {
      name: latestPublishedVersion.name.trim(),
      description: (latestPublishedVersion.description ?? "").trim(),
      isDefault: latestPublishedVersion.isDefault,
      fields: latestPublishedVersion.fields.map(toSnapshot),
    };

    const draftMap = new Map(draftSignature.fields.map((field) => [field.key, field]));
    const publishedMap = new Map(publishedSignature.fields.map((field) => [field.key, field]));

    const addedFields = draftSignature.fields.filter((field) => !publishedMap.has(field.key));
    const removedFields = publishedSignature.fields.filter((field) => !draftMap.has(field.key));
    const changedFields = draftSignature.fields
      .map((field) => {
        const before = publishedMap.get(field.key);
        if (!before) return null;
        const changes = diffField(before, field);
        if (changes.length === 0) return null;
        return { key: field.key, before, after: field, changes };
      })
      .filter(Boolean) as Array<{
      key: string;
      before: FieldSnapshot;
      after: FieldSnapshot;
      changes: string[];
    }>;

    return {
      draftSignature,
      publishedSignature,
      addedFields,
      removedFields,
      changedFields,
      nameChanged: draftSignature.name !== publishedSignature.name,
      descriptionChanged: draftSignature.description !== publishedSignature.description,
      defaultChanged: draftSignature.isDefault !== publishedSignature.isDefault,
      totalChanges: addedFields.length + removedFields.length + changedFields.length,
    };
  }, [draft.description, draft.fields, draft.isDefault, draft.name, latestPublishedVersion]);

  if (!latestPublishedVersion) {
    return (
      <Card className="rounded-[28px] p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <GitCompareArrows className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Draft versus published</h2>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              Publish once to create the first immutable snapshot. After that, this tab becomes a field-level compare view.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-8 text-sm leading-6 text-[rgb(var(--text-secondary))]">
          No published version exists yet. The draft will become the first snapshot the moment you publish the template.
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <GitCompareArrows className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              Draft versus version v{latestPublishedVersion.versionNumber}
            </h2>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              Review exactly what changed before publishing a new snapshot or restoring the published one into the draft.
            </p>
          </div>
        </div>

        {onRestoreVersion ? (
          <Button
            variant="secondary"
            onClick={() => void onRestoreVersion(latestPublishedVersion.id, latestPublishedVersion.versionNumber)}
            disabled={restorePending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restore snapshot
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryTile label="Name" value={diff?.nameChanged ? "Changed" : "Matches published"} />
        <SummaryTile label="Description" value={diff?.descriptionChanged ? "Changed" : "Matches published"} />
        <SummaryTile
          label="Fields"
          value={`${diff?.addedFields.length ?? 0} added, ${diff?.removedFields.length ?? 0} removed, ${diff?.changedFields.length ?? 0} edited`}
        />
        <SummaryTile label="Default" value={diff?.defaultChanged ? "Changed" : "Matches published"} />
        <SummaryTile label="State" value={diff && diff.totalChanges > 0 ? "Draft differs" : "Up to date"} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Field-level changes</p>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  Each card shows the published snapshot on the left and the current draft on the right.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[rgb(var(--text-secondary))]">
                {diff?.totalChanges ?? 0} changed blocks
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {diff?.nameChanged ? (
                <ComparisonRow label="Template name" published={diff.publishedSignature.name} draft={diff.draftSignature.name} />
              ) : null}

              {diff?.descriptionChanged ? (
                <ComparisonRow
                  label="Description"
                  published={diff.publishedSignature.description || "—"}
                  draft={diff.draftSignature.description || "—"}
                  allowWrap
                />
              ) : null}

              {diff?.defaultChanged ? (
                <ComparisonRow
                  label="Default state"
                  published={diff.publishedSignature.isDefault ? "Default template" : "Not default"}
                  draft={diff.draftSignature.isDefault ? "Default template" : "Not default"}
                />
              ) : null}

              {diff?.changedFields.length ? (
                <div className="space-y-3 pt-2">
                  {diff.changedFields.map((field) => (
                    <FieldDiffCard key={field.key} field={field} />
                  ))}
                </div>
              ) : null}

              {diff?.addedFields.length ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Added fields</p>
                  <div className="mt-3 space-y-2">
                    {diff.addedFields.map((field) => (
                      <FieldRow key={field.key} field={field} tone="added" />
                    ))}
                  </div>
                </div>
              ) : null}

              {diff?.removedFields.length ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Removed fields</p>
                  <div className="mt-3 space-y-2">
                    {diff.removedFields.map((field) => (
                      <FieldRow key={field.key} field={field} tone="removed" />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--surface-subtle))]">
                <Workflow className="h-4 w-4 text-[rgb(var(--text-muted))]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Snapshot details</p>
                <p className="text-sm text-[rgb(var(--text-secondary))]">Published v{latestPublishedVersion.versionNumber}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-[rgb(var(--text-secondary))]">
              <InfoRow
                label="Published at"
                value={new Date(latestPublishedVersion.publishedAt).toLocaleString()}
              />
              <InfoRow
                label="Version shape"
                value={`${latestPublishedVersion.fields.length} fields, ${latestPublishedVersion.fields.filter((field) => field.required).length} required, ${latestPublishedVersion.fields.filter((field) => (field.conditions ?? []).length > 0).length} conditional`}
              />
              <InfoRow
                label="Action"
                value="Restore this snapshot to replace the working draft while keeping history intact."
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">{label}</p>
      <p className="mt-2 text-sm text-[rgb(var(--text-primary))]">{value}</p>
    </div>
  );
}

function ComparisonRow({
  label,
  published,
  draft,
  allowWrap = false,
}: {
  label: string;
  published: string;
  draft: string;
  allowWrap?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{label}</p>
        <div className="flex items-center gap-2 text-xs font-medium text-[rgb(var(--text-muted))]">
          <span className="rounded-full bg-[rgb(var(--surface-subtle))] px-2.5 py-1">Published</span>
          <span className="rounded-full bg-[rgb(var(--surface-subtle))] px-2.5 py-1">Draft</span>
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
          <span className="block text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Published</span>
          <span className={`mt-1 block text-[rgb(var(--text-primary))] ${allowWrap ? "whitespace-pre-wrap" : "truncate"}`}>{published}</span>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
          <span className="block text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Draft</span>
          <span className={`mt-1 block text-[rgb(var(--text-primary))] ${allowWrap ? "whitespace-pre-wrap" : "truncate"}`}>{draft}</span>
        </div>
      </div>
    </div>
  );
}

function FieldDiffCard({
  field,
}: {
  field: {
    key: string;
    before: FieldSnapshot;
    after: FieldSnapshot;
    changes: string[];
  };
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{field.after.label}</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{field.key}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-[rgb(var(--text-secondary))]">
          {field.changes.map((change) => (
            <span key={change} className="rounded-full bg-[rgb(var(--surface-subtle))] px-2.5 py-1">
              {change}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <FieldSnapshotCard label="Published" snapshot={field.before} />
        <FieldSnapshotCard label="Draft" snapshot={field.after} />
      </div>
    </div>
  );
}

function FieldSnapshotCard({
  label,
  snapshot,
}: {
  label: string;
  snapshot: FieldSnapshot;
}) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
      <span className="block text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">{label}</span>
      <p className="mt-1 text-[rgb(var(--text-primary))]">
        {snapshot.label}
        {snapshot.required ? " (required)" : ""}
      </p>
      <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{snapshot.type}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[rgb(var(--text-muted))]">
        {snapshot.options.length ? <span>{snapshot.options.length} options</span> : null}
        {(snapshot.conditions?.length ?? 0) ? (
          <span>{snapshot.conditions?.length ?? 0} conditions</span>
        ) : null}
      </div>
    </div>
  );
}

function FieldRow({
  field,
  tone,
}: {
  field: FieldSnapshot;
  tone: "added" | "removed";
}) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{field.label}</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{field.key}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-[rgb(var(--text-secondary))]">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${tone === "added" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
          >
            {tone === "added" ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {tone === "added" ? "Added" : "Removed"}
          </span>
          <span className="rounded-full bg-[rgb(var(--surface-subtle))] px-2.5 py-1">{field.type}</span>
          {field.required ? <span className="rounded-full bg-[rgb(var(--surface-subtle))] px-2.5 py-1">Required</span> : null}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[rgb(var(--text-muted))]">
        {field.options?.length ? <span>{field.options.length} options</span> : null}
        {(field.conditions ?? []).length ? <span>{field.conditions?.length ?? 0} conditions</span> : null}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[rgb(var(--surface-subtle))] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">{label}</p>
      <p className="mt-1 text-[rgb(var(--text-primary))]">{value}</p>
    </div>
  );
}
