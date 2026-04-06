"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FileSignature, Plus } from "lucide-react";
import { Button } from "@novabots/ui";
import { ChangeOrderList } from "@/components/scope-guard/ChangeOrderList";
import { ChangeOrderEditor } from "@/components/scope-guard/ChangeOrderEditor";

export default function ProjectChangeOrdersPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [showEditor, setShowEditor] = useState(false);
  const [editingCo, setEditingCo] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
            <FileSignature className="h-6 w-6 text-amber-500" />
            Change Orders
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Manage scope change requests for this project
          </p>
        </div>
        <Button size="sm" onClick={() => setShowEditor(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create Change Order
        </Button>
      </div>

      {/* Change Order List */}
      <ChangeOrderList
        projectId={projectId}
        onCreate={() => setShowEditor(true)}
        onEdit={(co) => setEditingCo(co)}
      />

      {/* Create Editor */}
      <ChangeOrderEditor
        projectId={projectId}
        open={showEditor}
        onClose={() => setShowEditor(false)}
      />

      {/* Edit Editor */}
      {editingCo && (
        <ChangeOrderEditor
          projectId={projectId}
          open={!!editingCo}
          onClose={() => setEditingCo(null)}
          existingId={editingCo.id}
          existingData={{
            title: editingCo.title,
            description: editingCo.description ?? "",
            amount: editingCo.amount ?? null,
            lineItemsJson: editingCo.lineItemsJson ?? undefined,
          }}
        />
      )}
    </div>
  );
}
