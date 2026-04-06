"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Calendar, MoreVertical, Trash2, Pencil } from "lucide-react";
import { Button, Card, Skeleton, Dialog, Input, Textarea, DropdownMenu, DropdownItem, useToast } from "@novabots/ui";
import {
  getBriefTemplatesQueryOptions,
  useBriefTemplates,
  useCreateBriefTemplate,
  useDeleteBriefTemplate,
} from "@/hooks/useBriefTemplates";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { queryClient } from "@/lib/query-client";

export default function BriefsPage() {
  useAssetsReady({
    scopeId: "page:briefs",
    tasks: [() => queryClient.ensureQueryData(getBriefTemplatesQueryOptions())],
  });

  const { data, isLoading } = useBriefTemplates();
  const createTemplate = useCreateBriefTemplate();
  const deleteTemplate = useDeleteBriefTemplate();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const templates = data?.data ?? [];

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await createTemplate.mutateAsync({
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      toast("success", "Template created");
      setShowCreate(false);
      setName("");
      setDescription("");
    } catch {
      toast("error", "Failed to create template");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTemplate.mutateAsync(id);
      toast("success", "Template deleted");
      setDeletingId(null);
    } catch {
      toast("error", "Failed to delete template");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Brief Templates</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Create intake forms for client briefs
          </p>
        </div>
        <Button size="md" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(
            (tpl: {
              id: string;
              name: string;
              description?: string;
              fields?: unknown[];
              createdAt: string;
              updatedAt: string;
            }) => (
              <Card key={tpl.id} hoverable className="group relative flex flex-col">
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <DropdownMenu
                    trigger={
                      <button className="rounded p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    }
                  >
                    <DropdownItem onClick={() => setDeletingId(tpl.id)}>
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownItem>
                  </DropdownMenu>
                </div>

                <Link href={`/briefs/${tpl.id}/edit`} className="flex flex-1 flex-col p-0">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-[rgb(var(--text-primary))]">{tpl.name}</h3>
                  {tpl.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-[rgb(var(--text-muted))]">
                      {tpl.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-[rgb(var(--text-muted))]">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {(tpl.fields ?? []).length} fields
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(tpl.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              </Card>
            ),
          )}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            No templates yet
          </h3>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Create a brief template to start collecting client requirements.
          </p>
          <Button size="md" className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Brief Template">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign Brief"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this brief template for?"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleCreate()}
              disabled={!name.trim() || createTemplate.isPending}
            >
              {createTemplate.isPending ? "Creating..." : "Create & Edit"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Template"
      >
        <p className="mb-4 text-sm text-[rgb(var(--text-secondary))]">
          Are you sure you want to delete this template? Existing briefs using it will not be affected.
        </p>
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={() => setDeletingId(null)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => deletingId && void handleDelete(deletingId)}
            disabled={deleteTemplate.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteTemplate.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
