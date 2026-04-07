"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Eye,
  History,
  Rocket,
  RotateCcw,
  Settings2,
  Sparkles,
  Wand2,
  Workflow,
} from "lucide-react";
import { Button, Card, Skeleton, Textarea, useToast } from "@novabots/ui";
import { FormBuilder } from "@/components/brief/FormBuilder";
import { FormPreview } from "@/components/brief/FormPreview";
import { BriefModuleHeader } from "@/components/briefs/shared/brief-module-header";
import { BriefRouteNotFoundState } from "@/components/briefs/shared/route-state";
import { SaveStateIndicator } from "@/components/briefs/shared/save-state-indicator";
import { StatusBadge } from "@/components/briefs/shared/status-badge";
import { TemplateBrandingPanel } from "@/components/briefs/templates/template-branding-panel";
import { TemplateVersionComparePanel } from "@/components/briefs/templates/template-version-compare-panel";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import {
  useCreateBriefTemplate,
  useDeleteBriefTemplate,
  useBriefTemplateVersions,
  usePublishBriefTemplate,
  useRestoreBriefTemplateVersion,
  useUpdateBriefTemplate,
  type BriefField,
  type BriefTemplateBranding,
  type BriefTemplate,
} from "@/hooks/useBriefTemplates";
import { useWorkspace } from "@/hooks/useWorkspace";
import { type SaveState } from "@/lib/briefs";

type TemplateTab = "builder" | "logic" | "preview" | "branding" | "versions" | "settings";

interface TemplateDetailViewProps {
  templateId: string;
  template: BriefTemplate | undefined;
  isLoading?: boolean;
}

const TABS: Array<{ key: TemplateTab; label: string }> = [
  { key: "builder", label: "Builder" },
  { key: "logic", label: "Logic" },
  { key: "preview", label: "Preview" },
  { key: "branding", label: "Branding" },
  { key: "versions", label: "Versions" },
  { key: "settings", label: "Settings" },
];

export function TemplateDetailView({
  templateId,
  template,
  isLoading,
}: TemplateDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateTemplate = useUpdateBriefTemplate(templateId);
  const createTemplate = useCreateBriefTemplate();
  const deleteTemplate = useDeleteBriefTemplate();
  const publishTemplate = usePublishBriefTemplate(templateId);
  const restoreTemplateVersion = useRestoreBriefTemplateVersion(templateId);
  const versionsQuery = useBriefTemplateVersions(templateId);
  const workspace = useWorkspace();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabParam = searchParams.get("tab");
  const tab: TemplateTab = TABS.some((item) => item.key === tabParam)
    ? (tabParam as TemplateTab)
    : "builder";
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [fields, setFields] = useState<BriefField[]>(template?.fields ?? []);
  const [isDefault, setIsDefault] = useState(Boolean(template?.isDefault));
  const [branding, setBranding] = useState<BriefTemplateBranding>(template?.branding ?? {});
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    if (!template) return;
    setName(template.name);
    setDescription(template.description ?? "");
    setFields(template.fields);
    setIsDefault(Boolean(template.isDefault));
    setBranding(template.branding ?? {});
  }, [template]);

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields],
  );
  const requiredCount = useMemo(
    () => sortedFields.filter((field) => field.required).length,
    [sortedFields],
  );
  const conditionalCount = useMemo(
    () => sortedFields.filter((field) => (field.conditions ?? []).length > 0).length,
    [sortedFields],
  );
  const fieldTypeCounts = useMemo(() => {
    return sortedFields.reduce<Record<string, number>>((acc, field) => {
      acc[field.type] = (acc[field.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [sortedFields]);
  const workspaceBrandColor =
    typeof workspace.data?.data?.brandColor === "string"
      ? workspace.data.data.brandColor
      : "#0f172a";
  const workspaceName =
    typeof workspace.data?.data?.name === "string"
      ? workspace.data.data.name
      : "Your workspace";
  const publishedVersions = versionsQuery.data?.data ?? [];
  const latestPublishedVersion = publishedVersions[0] ?? null;
  const isArchived = template?.status === "archived";
  const draftDiff = useMemo(() => {
    if (!latestPublishedVersion) return null;

    const draftSignature = {
      name: name.trim(),
      description: description.trim(),
      isDefault,
      fields: sortedFields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder ?? null,
        helpText: field.helpText ?? null,
        options: field.options ?? [],
        conditions: field.conditions ?? [],
        order: field.order,
      })),
    };
    const publishedSignature = {
      name: latestPublishedVersion.name.trim(),
      description: (latestPublishedVersion.description ?? "").trim(),
      isDefault: latestPublishedVersion.isDefault,
      fields: latestPublishedVersion.fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder ?? null,
        helpText: field.helpText ?? null,
        options: field.options ?? [],
        conditions: field.conditions ?? [],
        order: field.order,
      })),
    };

    const publishedFieldMap = new Map(
      publishedSignature.fields.map((field) => [field.key, JSON.stringify(field)]),
    );
    const draftFieldMap = new Map(
      draftSignature.fields.map((field) => [field.key, JSON.stringify(field)]),
    );

    const addedFields = draftSignature.fields.filter(
      (field) => !publishedFieldMap.has(field.key),
    ).length;
    const removedFields = publishedSignature.fields.filter(
      (field) => !draftFieldMap.has(field.key),
    ).length;
    const changedFields = draftSignature.fields.filter((field) => {
      const published = publishedFieldMap.get(field.key);
      return published ? published !== JSON.stringify(field) : false;
    }).length;
    const nameChanged = draftSignature.name !== publishedSignature.name;
    const descriptionChanged = draftSignature.description !== publishedSignature.description;
    const defaultChanged = draftSignature.isDefault !== publishedSignature.isDefault;
    const changedFieldDetails = draftSignature.fields
      .map((field) => {
        const published = publishedFieldMap.get(field.key);
        if (!published) return null;
        const publishedField = publishedSignature.fields.find((entry) => entry.key === field.key);
        if (!publishedField || published === JSON.stringify(field)) return null;

        const before = publishedField;
        const after = field;
        const fieldChanges: string[] = [];
        if (before.label !== after.label) fieldChanges.push("label");
        if (before.type !== after.type) fieldChanges.push("type");
        if (before.required !== after.required) fieldChanges.push("required");
        if (before.placeholder !== after.placeholder) fieldChanges.push("placeholder");
        if (before.helpText !== after.helpText) fieldChanges.push("help text");
        if (JSON.stringify(before.options) !== JSON.stringify(after.options)) fieldChanges.push("options");
        if (JSON.stringify(before.conditions) !== JSON.stringify(after.conditions)) fieldChanges.push("conditions");
        if (before.order !== after.order) fieldChanges.push("order");

        return {
          key: field.key,
          label: field.label,
          fieldChanges,
          before,
          after,
        };
      })
      .filter(Boolean) as Array<{
      key: string;
      label: string;
      fieldChanges: string[];
      before: (typeof draftSignature.fields)[number];
      after: (typeof draftSignature.fields)[number];
    }>;

    const hasChanges =
      nameChanged || descriptionChanged || defaultChanged || addedFields > 0 || removedFields > 0 || changedFields > 0;

    return {
      hasChanges,
      nameChanged,
      descriptionChanged,
      defaultChanged,
      addedFields,
      removedFields,
      changedFields,
      changedFieldDetails,
      draftSignature,
      publishedSignature,
    };
  }, [description, isDefault, latestPublishedVersion, name, sortedFields]);
  const publishButtonLabel = latestPublishedVersion ? "Publish new version" : "Publish template";
  const readinessItems = [
    {
      label: "Template name and positioning",
      complete: name.trim().length > 0 && description.trim().length > 0,
    },
    {
      label: "At least one required client answer",
      complete: requiredCount > 0,
    },
    {
      label: "Conditional paths reviewed",
      complete: conditionalCount === 0 || tab === "logic",
    },
    {
      label: "Client preview checked",
      complete: sortedFields.length > 0,
    },
  ];

  async function persist(
    nextName: string,
    nextDescription: string,
    nextFields: BriefField[],
    nextBranding = branding,
    nextIsDefault = isDefault,
  ) {
    setSaveState("saving");
    try {
      await updateTemplate.mutateAsync({
        name: nextName,
        ...(nextDescription.trim() ? { description: nextDescription.trim() } : { description: "" }),
        fields: nextFields,
        branding: nextBranding,
        isDefault: nextIsDefault,
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function scheduleSave(
    nextName: string,
    nextDescription: string,
    nextFields: BriefField[],
    nextBranding = branding,
    nextIsDefault = isDefault,
  ) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      void persist(nextName, nextDescription, nextFields, nextBranding, nextIsDefault);
    }, 900);
  }

  const handleFieldsChange = (nextFields: BriefField[]) => {
    setFields(nextFields);
    scheduleSave(name, description, nextFields, branding);
  };

  const handleNameChange = (nextName: string) => {
    setName(nextName);
    scheduleSave(nextName, description, fields, branding, isDefault);
  };

  const handleDescriptionChange = (nextDescription: string) => {
    setDescription(nextDescription);
    scheduleSave(name, nextDescription, fields, branding, isDefault);
  };

  const handleDefaultChange = (checked: boolean) => {
    setIsDefault(checked);
    scheduleSave(name, description, fields, branding, checked);
  };

  const handleBrandingChange = (nextBranding: BriefTemplateBranding) => {
    setBranding(nextBranding);
    scheduleSave(name, description, fields, nextBranding, isDefault);
  };

  async function handleDuplicateTemplate() {
    try {
      const response = (await createTemplate.mutateAsync({
        name: `${name || "Untitled template"} copy`,
        description,
        fields,
        branding,
        isDefault: false,
      })) as { data?: { id?: string } };
      const nextId = response?.data?.id;
      toast("success", "Template duplicated");
      if (nextId) {
        router.push(`/briefs/templates/${nextId}`);
      }
    } catch {
      toast("error", "Failed to duplicate template");
    }
  }

  async function handleArchiveTemplate() {
    const accepted = await confirm({
      title: "Archive template?",
      description:
        "This will remove the template from active use. Existing briefs keep their history, but new projects should move to another template.",
      confirmText: "Archive template",
      variant: "danger",
    });
    if (!accepted) return;

    try {
      await deleteTemplate.mutateAsync(templateId);
      toast("success", "Template archived");
      router.push("/briefs/templates");
    } catch {
      toast("error", "Failed to archive template");
    }
  }

  async function handlePublishTemplate() {
    if (isArchived) {
      toast("error", "Restore this template before publishing a new version");
      return;
    }
    if (sortedFields.length === 0) {
      toast("error", "Add at least one field before publishing");
      return;
    }

    try {
      await persist(name, description, fields, branding, isDefault);
      await publishTemplate.mutateAsync();
      toast("success", "Template published");
    } catch {
      toast("error", "Failed to publish template");
    }
  }

  async function handleRestoreVersion(versionId: string, versionNumber: number) {
    const accepted = await confirm({
      title: `Restore version v${versionNumber}?`,
      description:
        "This will replace the current draft contents with the selected published version while keeping the version history intact.",
      confirmText: "Restore version",
    });
    if (!accepted) return;

    try {
      await restoreTemplateVersion.mutateAsync(versionId);
      toast("success", `Restored version v${versionNumber}`);
    } catch {
      toast("error", "Failed to restore template version");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <Skeleton className="h-[720px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!template) {
    return (
      <BriefRouteNotFoundState
        title="Template not found"
        description="This brief template could not be loaded. It may have been removed or you may not have access to it."
        backHref="/briefs/templates"
        backLabel="Back to templates"
      />
    );
  }

  function setTab(nextTab: TemplateTab) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", nextTab);
    router.replace(`/briefs/templates/${templateId}?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      {dialog}
      <BriefModuleHeader
        eyebrow="Template detail"
        title={name || "Untitled template"}
        description="Build the intake flow, preview the client experience, and keep the template ready for new project starts."
        actions={
          <>
            <Link href="/briefs/templates">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button variant="secondary" onClick={handleDuplicateTemplate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button
              onClick={handlePublishTemplate}
              disabled={
                publishTemplate.isPending ||
                updateTemplate.isPending ||
                sortedFields.length === 0 ||
                isArchived
              }
            >
              <Rocket className="mr-2 h-4 w-4" />
              {publishTemplate.isPending ? "Publishing..." : publishButtonLabel}
            </Button>
            <SaveStateIndicator state={saveState} />
            <StatusBadge status={template.status} kind="template" />
          </>
        }
      />

      <Card className="rounded-[28px] border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
              Publish state
            </p>
            <h3 className="mt-2 text-base font-semibold text-[rgb(var(--text-primary))]">
              {latestPublishedVersion ? `Latest published v${latestPublishedVersion.versionNumber}` : "No published version yet"}
            </h3>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              {draftDiff?.hasChanges
                ? "Your working draft differs from the last published snapshot."
                : latestPublishedVersion
                  ? "Your working draft matches the latest published snapshot."
                  : "Publish the template once the intake is ready. Until then, the portal will not use it for new briefs."}
            </p>
          </div>
          {latestPublishedVersion ? (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[rgb(var(--text-secondary))]">
                {latestPublishedVersion.fields.length} published fields
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[rgb(var(--text-secondary))]">
                {latestPublishedVersion.isDefault ? "Default template" : "Not default"}
              </span>
            </div>
          ) : null}
        </div>

        {draftDiff ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                  Name
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--text-primary))]">
                  {draftDiff.nameChanged ? "Changed" : "Matches published"}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                  Description
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--text-primary))]">
                  {draftDiff.descriptionChanged ? "Changed" : "Matches published"}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                  Fields
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--text-primary))]">
                  {draftDiff.addedFields} added, {draftDiff.removedFields} removed, {draftDiff.changedFields} edited
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                  Default
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--text-primary))]">
                  {draftDiff.defaultChanged ? "Changed" : "Matches published"}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                  State
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--text-primary))]">
                  {draftDiff.hasChanges ? "Draft differs" : "Up to date"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                    What changed
                  </p>
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                    A publish will replace the latest snapshot with the current draft state below.
                  </p>
                </div>
                <span className="rounded-full bg-[rgb(var(--surface-subtle))] px-3 py-1 text-xs font-medium text-[rgb(var(--text-secondary))]">
                  {draftDiff.changedFieldDetails.length} field updates
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                    Draft
                  </p>
                  <p className="mt-2 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {name || "Untitled template"}
                  </p>
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                    {description || "No description"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                    Latest published
                  </p>
                  <p className="mt-2 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {latestPublishedVersion?.name || "No published version yet"}
                  </p>
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                    {latestPublishedVersion?.description || "No published description"}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {draftDiff.nameChanged ? (
                  <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                      Name
                    </p>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <div className="rounded-xl bg-white px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
                        <span className="block text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Published</span>
                        <span className="mt-1 block text-[rgb(var(--text-primary))]">{latestPublishedVersion?.name || "—"}</span>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
                        <span className="block text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Draft</span>
                        <span className="mt-1 block text-[rgb(var(--text-primary))]">{name || "—"}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {draftDiff.descriptionChanged ? (
                  <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                      Description
                    </p>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <div className="rounded-xl bg-white px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
                        <span className="block text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Published</span>
                        <span className="mt-1 block whitespace-pre-wrap text-[rgb(var(--text-primary))]">
                          {latestPublishedVersion?.description || "—"}
                        </span>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
                        <span className="block text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Draft</span>
                        <span className="mt-1 block whitespace-pre-wrap text-[rgb(var(--text-primary))]">
                          {description || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {draftDiff.changedFieldDetails.length > 0 ? (
                  <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                      Field updates
                    </p>
                    <div className="mt-3 space-y-3">
                      {draftDiff.changedFieldDetails.map((field) => (
                        <div key={field.key} className="rounded-2xl bg-white px-4 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-[rgb(var(--text-primary))]">{field.label}</p>
                              <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                                {field.fieldChanges.length > 0 ? field.fieldChanges.join(", ") : "Updated"}
                              </p>
                            </div>
                            <span className="rounded-full bg-[rgb(var(--surface-subtle))] px-3 py-1 text-xs font-medium text-[rgb(var(--text-secondary))]">
                              {field.key}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            <div className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
                              <span className="block text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Published</span>
                              <span className="mt-1 block text-[rgb(var(--text-primary))]">
                                {field.before.label}
                                {field.before.required ? " (required)" : ""}
                              </span>
                              <span className="mt-1 block text-[rgb(var(--text-muted))]">
                                {field.before.type}
                              </span>
                            </div>
                            <div className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
                              <span className="block text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Draft</span>
                              <span className="mt-1 block text-[rgb(var(--text-primary))]">
                                {field.after.label}
                                {field.after.required ? " (required)" : ""}
                              </span>
                              <span className="mt-1 block text-[rgb(var(--text-muted))]">
                                {field.after.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.key
                ? "bg-[rgb(var(--primary-dark))] text-white"
                : "bg-white text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "builder" ? (
        <div className="rounded-[28px] border border-[rgb(var(--border-subtle))] bg-white p-4 shadow-[0_24px_50px_-36px_rgba(15,23,42,0.28)] lg:p-5">
          <FormBuilder fields={sortedFields} templateName={name} onChange={handleFieldsChange} />
        </div>
      ) : null}

      {tab === "logic" ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <Card className="rounded-[28px] p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Workflow className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Conditional logic
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  Review all conditional field logic in one place so the builder stays readable as templates get more advanced.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {sortedFields.filter((field) => (field.conditions ?? []).length > 0).length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-4 py-6 text-sm text-[rgb(var(--text-muted))]">
                  No conditional rules configured yet.
                </p>
              ) : (
                sortedFields
                  .filter((field) => (field.conditions ?? []).length > 0)
                  .map((field) => (
                    <div
                      key={field.key}
                      className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4"
                    >
                      <p className="font-medium text-[rgb(var(--text-primary))]">{field.label}</p>
                      <div className="mt-3 space-y-2">
                        {(field.conditions ?? []).map((condition, index) => (
                          <p
                            key={`${field.key}-${index}`}
                            className="text-sm leading-6 text-[rgb(var(--text-secondary))]"
                          >
                            Show when <span className="font-medium text-[rgb(var(--text-primary))]">{condition.field_key}</span> {condition.operator.replace("_", " ")} <span className="font-medium text-[rgb(var(--text-primary))]">{condition.value}</span>.
                          </p>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>

          <Card className="rounded-[28px] p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
                <Sparkles className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Logic QA notes
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  This tab is ready for future rule conflict detection and required-field path validation once backend publish rules are added.
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">
              <li>Use the Builder tab to edit field-level conditions.</li>
              <li>Use the Preview tab to test the actual client path.</li>
              <li>Complex validation should still happen at publish time on the backend.</li>
            </ul>
          </Card>
        </div>
      ) : null}

      {tab === "preview" ? (
        <Card className="rounded-[28px] p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Client preview
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                This is the shape clients will see when the brief is shared through the portal.
              </p>
            </div>
            <Eye className="h-5 w-5 text-[rgb(var(--text-muted))]" />
          </div>
          <div className="overflow-hidden rounded-[28px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))]">
            <FormPreview fields={sortedFields} templateName={name} />
          </div>
        </Card>
      ) : null}

      {tab === "branding" ? (
        <TemplateBrandingPanel
          workspaceName={workspaceName}
          workspaceLogoUrl={typeof workspace.data?.data?.logoUrl === "string" ? workspace.data.data.logoUrl : null}
          workspaceBrandColor={workspaceBrandColor}
          templateName={name}
          templateDescription={description}
          templateBranding={branding}
          publishedVersionBranding={latestPublishedVersion?.branding ?? null}
          onBrandingChange={handleBrandingChange}
          onSave={() => persist(name, description, fields, branding, isDefault)}
          saveState={saveState}
        />
      ) : null}

      {tab === "versions" ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
          <TemplateVersionComparePanel
            draft={{
              name,
              description,
              isDefault,
              fields: sortedFields,
            }}
            latestPublishedVersion={latestPublishedVersion}
            onRestoreVersion={handleRestoreVersion}
            restorePending={restoreTemplateVersion.isPending}
          />

          <Card className="rounded-[28px] p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Published versions
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  Each publish creates an immutable template snapshot the team can inspect or restore into the draft.
                </p>
              </div>
            </div>

            {versionsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 rounded-3xl" />
                <Skeleton className="h-24 rounded-3xl" />
              </div>
            ) : publishedVersions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-4 py-8 text-sm text-[rgb(var(--text-muted))]">
                No published versions yet. Publish the template to create the first immutable snapshot.
              </div>
            ) : (
              <div className="space-y-3">
                {publishedVersions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[rgb(var(--text-primary))]">
                          Version v{version.versionNumber}
                        </p>
                        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                          Published {new Date(version.publishedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {version.isDefault ? (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[rgb(var(--text-secondary))]">
                            Default
                          </span>
                        ) : null}
                        <Button
                          variant="ghost"
                          onClick={() => void handleRestoreVersion(version.id, version.versionNumber)}
                          disabled={restoreTemplateVersion.isPending}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
                        {version.fields.length} fields
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
                        {version.fields.filter((field) => field.required).length} required
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-3 text-sm text-[rgb(var(--text-secondary))]">
                        {version.fields.filter((field) => (field.conditions ?? []).length > 0).length} conditional
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
          <Card className="rounded-[28px] p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Settings2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Template settings
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  Keep naming and intake positioning clear for the team using this brief.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                  Template name
                </label>
                <input
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-[rgb(var(--border-default))] px-4 text-sm outline-none transition-colors focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <Textarea
                label="Description"
                value={description}
                onChange={(event) => handleDescriptionChange(event.target.value)}
                rows={6}
                placeholder="Describe when this template should be used."
              />
              <label className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-3">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(event) => handleDefaultChange(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[rgb(var(--border-default))] text-primary focus:ring-primary/20"
                />
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    Default template for new project kickoff
                  </p>
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                    Use this when the team wants one intake template to be the default starting point.
                  </p>
                </div>
              </label>
            </div>
          </Card>

          <Card className="rounded-[28px] p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
                <Sparkles className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Operational readiness</h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  Keep the draft share-ready and publish snapshots intentionally when the intake is ready for real client use.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-4 text-sm leading-6 text-[rgb(var(--text-secondary))]">
              <p className="font-medium text-[rgb(var(--text-primary))]">Share-ready checklist</p>
              <ul className="mt-3 space-y-3">
                {readinessItems.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${
                        item.complete ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  void persist(name, description, fields, branding, isDefault);
                  toast("success", "Template saved");
                }}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Save template
              </Button>
              <Button
                onClick={handlePublishTemplate}
                disabled={publishTemplate.isPending || sortedFields.length === 0 || isArchived}
              >
                <Rocket className="mr-2 h-4 w-4" />
                {publishTemplate.isPending ? "Publishing..." : publishButtonLabel}
              </Button>
              <Button variant="ghost" onClick={handleArchiveTemplate}>
                Archive
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
