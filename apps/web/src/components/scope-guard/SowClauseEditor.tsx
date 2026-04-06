"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Scale, Calendar, DollarSign, XCircle, Plus, Trash2,
  CheckCircle2, Eye, Edit2, ChevronDown, ChevronUp, Save
} from "lucide-react";
import { Card, Badge, Button, Dialog, Textarea, Input, useToast } from "@novabots/ui";
import type { StatementOfWork, SowClause, ClauseType } from "@/hooks/useSow";
import { useUpdateSowClauses } from "@/hooks/useSow";
import { cn } from "@novabots/ui";

interface SowClauseEditorProps {
  sow: StatementOfWork;
  projectId: string;
  onActivate: () => void;
}

const CLAUSE_TYPE_CONFIG: Record<ClauseType, { label: string; icon: React.ElementType; color: string; badgeStatus: "active" | "pending" | "flagged" | "draft" }> = {
  deliverable: { label: "Deliverable", icon: FileText, color: "text-blue-500", badgeStatus: "active" },
  revision_limit: { label: "Revision Limit", icon: Scale, color: "text-purple-500", badgeStatus: "pending" },
  timeline: { label: "Timeline", icon: Calendar, color: "text-amber-500", badgeStatus: "pending" },
  exclusion: { label: "Exclusion", icon: XCircle, color: "text-red-500", badgeStatus: "flagged" },
  payment_term: { label: "Payment Term", icon: DollarSign, color: "text-green-500", badgeStatus: "active" },
  other: { label: "Other", icon: Scale, color: "text-[rgb(var(--text-muted))]", badgeStatus: "draft" },
};

const CLAUSE_TYPE_OPTIONS: { value: ClauseType; label: string }[] = Object.entries(CLAUSE_TYPE_CONFIG).map(
  ([value, config]) => ({ value: value as ClauseType, label: config.label }),
);

function TypeIcon({ type }: { type: ClauseType }) {
  const config = CLAUSE_TYPE_CONFIG[type];
  const { icon: Icon } = config;
  return <Icon className={cn("h-4 w-4", config.color)} />;
}

function GroupedClauses({
  clauses,
  typeFilter,
  onEdit,
  onDelete,
  expanding,
  isExpanded,
  onToggleExpand,
}: {
  clauses: SowClause[];
  typeFilter: ClauseType | "all";
  onEdit: (clause: SowClause) => void;
  onDelete: (id: string) => void;
  expanding: string | null;
  isExpanded: (id: string) => boolean;
  onToggleExpand: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<ClauseType, SowClause[]>();
    for (const clause of clauses) {
      if (typeFilter !== "all" && clause.clauseType !== typeFilter) continue;
      const arr = map.get(clause.clauseType) ?? [];
      arr.push(clause);
      map.set(clause.clauseType, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [clauses, typeFilter]);

  if (groups.length === 0) {
    return (
      <Card className="py-8 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-[rgb(var(--text-muted))]" />
        <p className="text-sm text-[rgb(var(--text-muted))]">No clauses in this category</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([type, items]) => {
        const config = CLAUSE_TYPE_CONFIG[type];
        return (
          <div key={type}>
            <div className="mb-2 flex items-center gap-2">
              <TypeIcon type={type} />
              <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                {config.label}
                <span className="ml-1.5 text-xs font-normal text-[rgb(var(--text-muted))]">
                  ({items.length})
                </span>
              </h4>
            </div>
            <div className="space-y-2">
              {items.map((clause) => (
                <ClauseRow
                  key={clause.id}
                  clause={clause}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isExpanded={isExpanded(clause.id)}
                  onToggleExpand={onToggleExpand}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClauseRow({
  clause,
  onEdit,
  onDelete,
  isExpanded,
  onToggleExpand,
}: {
  clause: SowClause;
  onEdit: (clause: SowClause) => void;
  onDelete: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}) {
  const config = CLAUSE_TYPE_CONFIG[clause.clauseType];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
    >
      <div className="group rounded-xl border border-[rgb(var(--border-subtle))] bg-white transition-all hover:border-[rgb(var(--border-default))] hover:shadow-sm">
        <div className="flex items-start gap-3 p-3">
          <button
            onClick={() => onToggleExpand(clause.id)}
            className="mt-0.5 rounded p-0.5 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--surface-subtle))]">
            <TypeIcon type={clause.clauseType} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge status={config.badgeStatus} className="text-[10px]">
                {config.label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-[rgb(var(--text-primary))] line-clamp-2">
              {clause.summary || clause.originalText}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onEdit(clause)}
              className="rounded p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))] hover:text-primary"
              title="Edit clause"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(clause.id)}
              className="rounded p-1.5 text-[rgb(var(--text-muted))] hover:bg-red-50 hover:text-red-500"
              title="Delete clause"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-[rgb(var(--border-subtle))] px-3 pb-3 pt-2">
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                  {clause.originalText}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function SowClauseEditor({ sow, projectId, onActivate }: SowClauseEditorProps) {
  const { toast } = useToast();
  const updateClauses = useUpdateSowClauses(sow.id, projectId);

  const [clauses, setClauses] = useState<SowClause[]>(sow.clauses ?? []);
  const [typeFilter, setTypeFilter] = useState<ClauseType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingClause, setEditingClause] = useState<SowClause | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Edit form state
  const [editText, setEditText] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editType, setEditType] = useState<ClauseType>("other");

  // Add form state
  const [addText, setAddText] = useState("");
  const [addSummary, setAddSummary] = useState("");
  const [addType, setAddType] = useState<ClauseType>("other");

  const openEdit = useCallback((clause: SowClause) => {
    setEditingClause(clause);
    setEditText(clause.originalText);
    setEditSummary(clause.summary ?? "");
    setEditType(clause.clauseType);
    setShowEditDialog(true);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingClause || !editText.trim()) return;
    setClauses((prev) =>
      prev.map((c) =>
        c.id === editingClause.id
          ? { ...c, originalText: editText.trim(), summary: editSummary.trim() || null, clauseType: editType }
          : c,
      ),
    );
    setShowEditDialog(false);
    setEditingClause(null);
  }, [editingClause, editText, editSummary, editType]);

  const deleteClause = useCallback((id: string) => {
    setClauses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addClause = useCallback(() => {
    if (!addText.trim()) return;
    const newClause: SowClause = {
      id: crypto.randomUUID(),
      sowId: sow.id,
      clauseType: addType,
      originalText: addText.trim(),
      summary: addSummary.trim() || null,
      sortOrder: clauses.length,
      createdAt: new Date().toISOString(),
    };
    setClauses((prev) => [...prev, newClause]);
    setAddText("");
    setAddSummary("");
    setAddType("other");
    setShowAddDialog(false);
  }, [addText, addSummary, addType, clauses.length, sow.id]);

  const handleActivate = async () => {
    if (clauses.length === 0) {
      toast("error", "Add at least one clause before activating");
      return;
    }
    try {
      const clauseData = clauses.map((c, i) => ({
        clauseType: c.clauseType,
        originalText: c.originalText,
        summary: c.summary,
        sortOrder: i,
      }));
      await updateClauses.mutateAsync(clauseData);
      toast("success", "SOW clauses saved and activated");
      onActivate();
    } catch {
      toast("error", "Failed to activate SOW");
    }
  };

  const isExpanded = useCallback((id: string) => expandedId === id, [expandedId]);
  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">{sow.title}</h3>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            {clauses.length} clause{clauses.length !== 1 ? "s" : ""} parsed — review and edit before activating
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Clause
          </Button>
          <Button
            size="sm"
            onClick={() => void handleActivate()}
            disabled={updateClauses.isPending || clauses.length === 0}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Activate SOW
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setTypeFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            typeFilter === "all"
              ? "bg-primary text-white"
              : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle))]",
          )}
        >
          All ({clauses.length})
        </button>
        {CLAUSE_TYPE_OPTIONS.map((opt) => {
          const count = clauses.filter((c) => c.clauseType === opt.value).length;
          if (count === 0) return null;
          return (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                typeFilter === opt.value
                  ? "bg-primary text-white"
                  : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle))]",
              )}
            >
              {opt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Clauses list */}
      <GroupedClauses
        clauses={clauses}
        typeFilter={typeFilter}
        onEdit={openEdit}
        onDelete={deleteClause}
        expanding={expandedId}
        isExpanded={isExpanded}
        onToggleExpand={toggleExpand}
      />

      {/* Save bar */}
      <div className="sticky bottom-0 flex items-center justify-between rounded-xl border border-[rgb(var(--border-default))] bg-white p-4 shadow-lg">
        <p className="text-xs text-[rgb(var(--text-muted))]">
          Changes are saved locally. Click <strong>Activate SOW</strong> to persist.
        </p>
        <Button
          size="sm"
          onClick={() => void handleActivate()}
          disabled={updateClauses.isPending}
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {updateClauses.isPending ? "Saving..." : "Save & Activate"}
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} title="Edit Clause">
        {editingClause && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Type
              </label>
              <div className="relative">
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as ClauseType)}
                  className="w-full appearance-none rounded-xl border border-[rgb(var(--border-default))] bg-white px-4 py-2.5 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {CLAUSE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Clause Text
              </label>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={5}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Summary (optional)
              </label>
              <Input
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                placeholder="Brief summary of this clause"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={!editText.trim()}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} title="Add Clause">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Type
            </label>
            <div className="relative">
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value as ClauseType)}
                className="w-full appearance-none rounded-xl border border-[rgb(var(--border-default))] bg-white px-4 py-2.5 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {CLAUSE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Clause Text <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              placeholder="Enter the clause text..."
              rows={5}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Summary (optional)
            </label>
            <Input
              value={addSummary}
              onChange={(e) => setAddSummary(e.target.value)}
              placeholder="Brief summary of this clause"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={addClause} disabled={!addText.trim()}>
              Add Clause
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
