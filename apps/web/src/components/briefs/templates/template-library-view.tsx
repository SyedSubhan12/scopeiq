"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Sparkles } from "lucide-react";
import { Button, Card, Dialog, Input, Skeleton, Textarea, useToast } from "@novabots/ui";
import { BriefModuleHeader } from "@/components/briefs/shared/brief-module-header";
import { EmptyStateCard } from "@/components/briefs/shared/empty-state-card";
import { TemplateCard } from "@/components/briefs/templates/template-card";
import {
  useCreateBriefTemplate,
  useDeleteBriefTemplate,
  type BriefTemplate,
} from "@/hooks/useBriefTemplates";

interface TemplateLibraryViewProps {
  templates: BriefTemplate[];
  isLoading?: boolean;
}

export function TemplateLibraryView({
  templates,
  isLoading,
}: TemplateLibraryViewProps) {
  const createTemplate = useCreateBriefTemplate();
  const deleteTemplate = useDeleteBriefTemplate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        (template.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [templates, search]);

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      const result = await createTemplate.mutateAsync({
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      toast("success", "Template created");
      setShowCreate(false);
      setName("");
      setDescription("");
      const nextId = (result as { data?: { id?: string } })?.data?.id;
      if (nextId) {
        window.location.href = `/briefs/templates/${nextId}`;
      }
    } catch {
      toast("error", "Failed to create template");
    }
  }

  return (
    <div className="space-y-6">
      <BriefModuleHeader
        eyebrow="Templates"
        title="Brief template library"
        description="Create, edit, and publish intake templates that turn vague project requests into cleaner project starts."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/briefs/templates/marketplace">
              <Button variant="secondary">
                <Sparkles className="mr-2 h-4 w-4" />
                Marketplace
              </Button>
            </Link>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New template
            </Button>
          </div>
        }
      />

      <Card className="rounded-3xl p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates..."
            className="h-11 w-full rounded-2xl border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] py-2 pl-10 pr-4 text-sm text-[rgb(var(--text-primary))] outline-none transition-colors focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <EmptyStateCard
          title="No templates found"
          description="Create a brief template to standardize project intake and review."
          actionLabel="Create template"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New brief template">
        <div className="space-y-4">
          <Input
            label="Template name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Website redesign brief"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe when this template should be used."
            rows={4}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} loading={createTemplate.isPending}>
              Create and edit
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

