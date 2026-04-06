"use client";

import { useState } from "react";
import { CreditCard, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  useToast,
} from "@novabots/ui";
import { useRateCard, useCreateRateCardItem } from "@/hooks/useRateCard";
import { useDeleteRateCardItem, useUpdateRateCardItem } from "@/hooks/useRateCard.mutations";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog, useConfirm } from "@/components/shared/ConfirmDialog";

interface RateCardItem {
  id: string;
  name: string;
  rateInCents: number;
  unit?: string;
  description?: string;
}

export default function RateCardSettingsPage() {
  const { data, isLoading } = useRateCard();
  const createRateCardItem = useCreateRateCardItem();
  const deleteRateCardItem = useDeleteRateCardItem();
  const updateRateCardItem = useUpdateRateCardItem();
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();

  const rateCardItems: RateCardItem[] = (data?.data as RateCardItem[]) ?? [];

  const [newItemName, setNewItemName] = useState("");
  const [newItemRate, setNewItemRate] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("hour");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const startEditing = (item: RateCardItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditRate(String(item.rateInCents / 100));
    setEditUnit(item.unit ?? "hour");
    setEditDescription(item.description ?? "");
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (item: RateCardItem) => {
    if (!editName.trim() || !editRate) return;
    try {
      await updateRateCardItem.mutateAsync({
        id: item.id,
        name: editName.trim(),
        rateInCents: Math.round(parseFloat(editRate) * 100),
        unit: editUnit,
        description: editDescription.trim() || undefined,
      });
      toast("success", "Rate card item updated");
      setEditingId(null);
    } catch {
      toast("error", "Failed to update item");
    }
  };

  const handleDelete = async (item: RateCardItem) => {
    const confirmed = await confirm({
      title: "Delete rate card item",
      description: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await deleteRateCardItem.mutateAsync(item.id);
      toast("success", "Rate card item deleted");
    } catch {
      toast("error", "Failed to delete item");
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemRate) {
      toast("error", "Service name and rate are required");
      return;
    }
    try {
      await createRateCardItem.mutateAsync({
        name: newItemName.trim(),
        rateInCents: Math.round(parseFloat(newItemRate) * 100),
        unit: newItemUnit,
        description: newItemDescription.trim() || undefined,
      });
      toast("success", "Rate card item added");
      setNewItemName("");
      setNewItemRate("");
      setNewItemUnit("hour");
      setNewItemDescription("");
      setShowForm(false);
    } catch {
      toast("error", "Failed to add item");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[rgb(var(--surface-subtle))]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[rgb(var(--surface-subtle))]" />
        </div>
        <div className="h-48 w-full animate-pulse rounded-xl bg-[rgb(var(--surface-subtle))]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[rgb(var(--text-muted))]" />
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            Rate Card
          </h1>
        </div>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Manage your service rates and pricing
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Service Items</CardTitle>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {rateCardItems.length === 0 && !showForm ? (
            <EmptyState
              title="No rate card items yet"
              description="Add your first service item to start building estimates"
              icon={CreditCard}
              actionButton={
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add First Item
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {/* Existing items */}
              {rateCardItems.length > 0 && (
                <div className="divide-y divide-[rgb(var(--border-subtle))] rounded-lg border border-[rgb(var(--border-default))]">
                  {rateCardItems.map((item) => {
                    const isEditing = editingId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="px-4 py-3 transition-colors hover:bg-[rgb(var(--surface-subtle))]"
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">
                                  Service
                                </label>
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Service name"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">
                                    Rate ($)
                                  </label>
                                  <Input
                                    type="number"
                                    value={editRate}
                                    onChange={(e) => setEditRate(e.target.value)}
                                    placeholder="150"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">
                                    Unit
                                  </label>
                                  <select
                                    value={editUnit}
                                    onChange={(e) => setEditUnit(e.target.value)}
                                    className="w-full rounded-lg border border-[rgb(var(--border-default))] px-2 py-2 text-sm outline-none focus:border-primary"
                                  >
                                    <option value="hour">Hour</option>
                                    <option value="day">Day</option>
                                    <option value="project">Project</option>
                                    <option value="unit">Unit</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">
                                Description
                              </label>
                              <Input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Optional description"
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={cancelEditing}
                              >
                                <X className="mr-1 h-3.5 w-3.5" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => void handleSaveEdit(item)}
                                disabled={
                                  !editName.trim() ||
                                  !editRate ||
                                  updateRateCardItem.isPending
                                }
                              >
                                <Check className="mr-1 h-3.5 w-3.5" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="mt-0.5 truncate text-xs text-[rgb(var(--text-muted))]">
                                  {item.description}
                                </p>
                              )}
                              {item.unit && (
                                <p className="text-xs text-[rgb(var(--text-muted))]">
                                  per {item.unit}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                                ${(item.rateInCents / 100).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditing(item)}
                                className="rounded-md p-1.5 text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]"
                                aria-label={`Edit ${item.name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(item)}
                                className="rounded-md p-1.5 text-[rgb(var(--text-muted))] transition-colors hover:bg-red-50 hover:text-red-500"
                                aria-label={`Delete ${item.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add form */}
              {showForm && (
                <div className="rounded-lg border border-[rgb(var(--border-default))] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[rgb(var(--text-primary))]">
                    New Rate Card Item
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">
                        Service Name
                      </label>
                      <Input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g. UI Design"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">
                          Rate ($)
                        </label>
                        <Input
                          type="number"
                          value={newItemRate}
                          onChange={(e) => setNewItemRate(e.target.value)}
                          placeholder="150"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">
                          Unit
                        </label>
                        <select
                          value={newItemUnit}
                          onChange={(e) => setNewItemUnit(e.target.value)}
                          className="w-full rounded-lg border border-[rgb(var(--border-default))] px-2 py-2 text-sm outline-none focus:border-primary"
                        >
                          <option value="hour">Hour</option>
                          <option value="day">Day</option>
                          <option value="project">Project</option>
                          <option value="unit">Unit</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">
                        Description (optional)
                      </label>
                      <Input
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        placeholder="Brief description of the service"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setShowForm(false);
                          setNewItemName("");
                          setNewItemRate("");
                          setNewItemUnit("hour");
                          setNewItemDescription("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handleAddItem()}
                        disabled={
                          !newItemName.trim() ||
                          !newItemRate ||
                          createRateCardItem.isPending
                        }
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {confirmDialog}
    </div>
  );
}
