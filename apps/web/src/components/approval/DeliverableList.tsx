"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, ImageIcon, Clock, CheckCircle2, AlertCircle,
  RotateCcw, Circle, Plus, Trash2, Link2, Video, Figma,
  ExternalLink, ChevronDown
} from "lucide-react";
import { Card, Badge, Button, Skeleton, Dialog, Input, useToast } from "@novabots/ui";
import { useDeliverables, useCreateDeliverable, useDeleteDeliverable, type Deliverable } from "@/hooks/useDeliverables";
import { cn } from "@novabots/ui";

const statusConfig: Record<
  Deliverable["status"],
  { label: string; icon: React.ReactNode; badgeStatus: string }
> = {
  draft: { label: "Draft", icon: <Circle className="h-4 w-4" />, badgeStatus: "draft" },
  delivered: { label: "Delivered", icon: <Clock className="h-4 w-4" />, badgeStatus: "active" },
  in_review: { label: "In Review", icon: <AlertCircle className="h-4 w-4" />, badgeStatus: "pending" },
  changes_requested: { label: "Changes Requested", icon: <RotateCcw className="h-4 w-4" />, badgeStatus: "flagged" },
  approved: { label: "Approved", icon: <CheckCircle2 className="h-4 w-4" />, badgeStatus: "active" },
};

const typeConfig: Record<Deliverable["type"], { label: string; icon: React.ElementType; color: string }> = {
  file: { label: "File", icon: FileText, color: "text-blue-500" },
  figma: { label: "Figma", icon: Figma, color: "text-purple-500" },
  loom: { label: "Loom", icon: Video, color: "text-pink-500" },
  youtube: { label: "YouTube", icon: Video, color: "text-red-500" },
  link: { label: "Link", icon: Link2, color: "text-green-500" },
};

function TypeIcon({ type, mimeType }: { type: Deliverable["type"]; mimeType?: string | null }) {
  if (type === "file") {
    if (mimeType?.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (mimeType === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType?.startsWith("video/")) return <Video className="h-5 w-5 text-indigo-500" />;
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  const cfg = typeConfig[type];
  return <cfg.icon className={cn("h-5 w-5", cfg.color)} />;
}

interface DeliverableListProps {
  projectId: string;
  onSelect: (deliverable: Deliverable) => void;
  selectedId?: string | undefined;
}

type DeliverableType = Deliverable["type"];

const TYPE_OPTIONS: { value: DeliverableType; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { value: "file", label: "Upload File", description: "Image, PDF, video, ZIP", icon: FileText, color: "text-blue-500" },
  { value: "figma", label: "Figma", description: "Paste a Figma share link", icon: Figma, color: "text-purple-500" },
  { value: "loom", label: "Loom", description: "Paste a Loom video link", icon: Video, color: "text-pink-500" },
  { value: "youtube", label: "YouTube", description: "Paste a YouTube video link", icon: Video, color: "text-red-500" },
  { value: "link", label: "External Link", description: "Any other URL", icon: Link2, color: "text-green-500" },
];

export function DeliverableList({ projectId, onSelect, selectedId }: DeliverableListProps) {
  const { data, isLoading } = useDeliverables(projectId);
  const createDeliverable = useCreateDeliverable(projectId);
  const deleteDeliverable = useDeleteDeliverable(projectId);
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState<"type" | "details">("type");
  const [selectedType, setSelectedType] = useState<DeliverableType>("file");
  const [name, setName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [maxRevisions, setMaxRevisions] = useState(3);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deliverables: Deliverable[] = data?.data ?? [];

  const resetCreate = () => {
    setStep("type");
    setSelectedType("file");
    setName("");
    setExternalUrl("");
    setMaxRevisions(3);
  };

  async function handleCreate() {
    if (!name.trim()) return;
    if (selectedType !== "file" && !externalUrl.trim()) {
      toast("error", "Please enter a URL");
      return;
    }
    try {
      await createDeliverable.mutateAsync({
        name: name.trim(),
        type: selectedType,
        ...(externalUrl.trim() ? { externalUrl: externalUrl.trim() } : {}),
        maxRevisions,
      });
      toast("success", "Deliverable created");
      setShowCreate(false);
      resetCreate();
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
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
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
        <Button size="sm" onClick={() => { resetCreate(); setShowCreate(true); }}>
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
                <div
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-sm",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-[rgb(var(--border-default))] bg-white hover:border-primary/40",
                  )}
                  onClick={() => onSelect(deliverable)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--surface-subtle))]">
                    <TypeIcon type={deliverable.type} mimeType={deliverable.mimeType} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                        {deliverable.name}
                      </p>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
                      <Badge status={config.badgeStatus as "active" | "pending" | "draft" | "flagged"} className="text-[10px]">
                        {config.label}
                      </Badge>
                      <span>Round {deliverable.revisionRound}/{deliverable.maxRevisions}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingId(deliverable.id); }}
                    className="shrink-0 rounded p-1 text-[rgb(var(--text-muted))] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Create Dialog */}
      <Dialog
        open={showCreate}
        onClose={() => { setShowCreate(false); resetCreate(); }}
        title={step === "type" ? "What type of deliverable?" : "Deliverable details"}
      >
        {step === "type" ? (
          <div className="grid grid-cols-1 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSelectedType(opt.value); setStep("details"); }}
                className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border-default))] p-3.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--surface-subtle))]">
                  <opt.icon className={cn("h-5 w-5", opt.color)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{opt.label}</p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">{opt.description}</p>
                </div>
                <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-[rgb(var(--text-muted))]" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setStep("type")}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80"
            >
              ← Change type
            </button>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. ${selectedType === "figma" ? "Homepage Design" : selectedType === "loom" ? "Walkthrough Video" : "Logo Files"}`}
                onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
              />
            </div>

            {selectedType !== "file" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                  URL <span className="text-red-500">*</span>
                </label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder={
                    selectedType === "figma" ? "https://www.figma.com/file/..." :
                    selectedType === "loom" ? "https://www.loom.com/share/..." :
                    selectedType === "youtube" ? "https://www.youtube.com/watch?v=..." :
                    "https://"
                  }
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Max Revisions
              </label>
              <div className="relative">
                <select
                  value={maxRevisions}
                  onChange={(e) => setMaxRevisions(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-[rgb(var(--border-default))] bg-white px-4 py-2.5 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {[1, 2, 3, 5, 10].map((n) => (
                    <option key={n} value={n}>{n} round{n > 1 ? "s" : ""}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
              </div>
            </div>

            {selectedType === "file" && (
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                After creating, use the <strong>Upload</strong> button to attach a file.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={() => { setShowCreate(false); resetCreate(); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleCreate()}
                disabled={!name.trim() || (selectedType !== "file" && !externalUrl.trim()) || createDeliverable.isPending}
              >
                {createDeliverable.isPending ? "Creating…" : "Create Deliverable"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Deliverable">
        <p className="mb-4 text-sm text-[rgb(var(--text-secondary))]">
          This will permanently delete the deliverable and all its feedback. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)}>Cancel</Button>
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
