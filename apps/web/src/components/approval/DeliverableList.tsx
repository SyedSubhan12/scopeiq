"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ImageIcon, Clock, CheckCircle2, AlertCircle, RotateCcw, Circle, Plus, Trash2 } from "lucide-react";
import { Card, Badge, Button, Skeleton, Dialog, Input, useToast } from "@novabots/ui";
import { useDeliverables, useCreateDeliverable, useDeleteDeliverable, type Deliverable } from "@/hooks/useDeliverables";
import { cn } from "@novabots/ui";

const statusConfig: Record<
  Deliverable["status"],
  { label: string; icon: React.ReactNode; badgeStatus: string }
> = {
  not_started: {
    label: "Not Started",
    icon: <Circle className="h-4 w-4" />,
    badgeStatus: "draft",
  },
  in_progress: {
    label: "In Progress",
    icon: <Clock className="h-4 w-4" />,
    badgeStatus: "active",
  },
  in_review: {
    label: "In Review",
    icon: <AlertCircle className="h-4 w-4" />,
    badgeStatus: "in_review",
  },
  revision_requested: {
    label: "Revision Requested",
    icon: <RotateCcw className="h-4 w-4" />,
    badgeStatus: "flagged",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="h-4 w-4" />,
    badgeStatus: "approved",
  },
};

function fileTypeIcon(fileType?: string | null) {
  if (!fileType) return <FileText className="h-5 w-5 text-[rgb(var(--text-muted))]" />;
  if (fileType.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-500" />;
  if (fileType === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
  return <FileText className="h-5 w-5 text-[rgb(var(--text-muted))]" />;
}

interface DeliverableListProps {
  projectId: string;
  onSelect: (deliverable: Deliverable) => void;
  selectedId?: string;
}

export function DeliverableList({ projectId, onSelect, selectedId }: DeliverableListProps) {
  const { data, isLoading } = useDeliverables(projectId);
  const createDeliverable = useCreateDeliverable(projectId);
  const deleteDeliverable = useDeleteDeliverable(projectId);
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deliverables: Deliverable[] = data?.data ?? [];

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      await createDeliverable.mutateAsync({ name: newName.trim(), description: newDescription.trim() || undefined });
      toast("success", "Deliverable created");
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
    } catch {
      toast("error", "Failed to create deliverable");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDeliverable.mutateAsync(id);
      toast("success", "Deliverable deleted");
      setDeletingId(null);
    } catch {
      toast("error", "Failed to delete deliverable");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
          Deliverables
          {deliverables.length > 0 && (
            <span className="ml-2 text-sm font-normal text-[rgb(var(--text-muted))]">
              ({deliverables.length})
            </span>
          )}
        </h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {deliverables.length === 0 ? (
        <Card className="py-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-[rgb(var(--text-muted))]" />
          <p className="text-sm text-[rgb(var(--text-muted))]">No deliverables yet.</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">Add one to get started.</p>
        </Card>
      ) : (
        <AnimatePresence initial={false}>
          {deliverables.map((deliverable) => {
            const config = statusConfig[deliverable.status];
            const isSelected = selectedId === deliverable.id;

            return (
              <motion.div
                key={deliverable.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  hoverable
                  className={cn(
                    "flex cursor-pointer items-center gap-3 transition-all",
                    isSelected && "border-primary ring-1 ring-primary",
                  )}
                  onClick={() => onSelect(deliverable)}
                >
                  <div className="shrink-0">{fileTypeIcon(deliverable.file_type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-[rgb(var(--text-primary))]">
                        {deliverable.name}
                      </p>
                      <Badge status={config.badgeStatus as "approved" | "draft" | "active" | "in_review" | "flagged"}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-[rgb(var(--text-muted))]">
                      <span>Round {deliverable.revision_round} of {deliverable.revision_limit}</span>
                      {deliverable.file_name && (
                        <span className="truncate">{deliverable.file_name}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(deliverable.id);
                    }}
                    className="shrink-0 rounded p-1 text-[rgb(var(--text-muted))] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 [*:hover_>_&]:opacity-100"
                    aria-label="Delete deliverable"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Add Deliverable">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Homepage Hero Design"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Description
            </label>
            <Input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleCreate()}
              disabled={!newName.trim() || createDeliverable.isPending}
            >
              {createDeliverable.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Deliverable"
      >
        <p className="mb-4 text-sm text-[rgb(var(--text-secondary))]">
          Are you sure you want to delete this deliverable? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={() => setDeletingId(null)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => deletingId && void handleDelete(deletingId)}
            disabled={deleteDeliverable.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteDeliverable.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
