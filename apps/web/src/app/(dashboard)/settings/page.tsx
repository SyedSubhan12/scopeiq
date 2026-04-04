"use client";

import { useState, useEffect } from "react";
import { Save, Palette, Building, CreditCard, Plus, Trash2, Bell } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Button, Input, Badge, useToast } from "@novabots/ui";
import { useWorkspace, useUpdateWorkspace } from "@/hooks/useWorkspace";
import { useRateCard, useCreateRateCardItem } from "@/hooks/useRateCard";
import { ReminderSettings } from "@/components/approval/ReminderSettings";

export default function SettingsPage() {
  const { data, isLoading } = useWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const { data: rateCardData, isLoading: loadingRateCard } = useRateCard();
  const createRateCardItem = useCreateRateCardItem();
  const { toast } = useToast();

  const workspace = data?.data;
  const rateCardItems = rateCardData?.data ?? [];

  const [wsName, setWsName] = useState("");
  const [brandColor, setBrandColor] = useState("#0F6E56");
  const [newItemName, setNewItemName] = useState("");
  const [newItemRate, setNewItemRate] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("hour");

  useEffect(() => {
    if (workspace) {
      setWsName(workspace.name ?? "");
      setBrandColor(workspace.brandColor ?? "#0F6E56");
    }
  }, [workspace]);

  const handleSaveWorkspace = async () => {
    try {
      await updateWorkspace.mutateAsync({ name: wsName, brandColor });
      toast("success", "Workspace updated");
    } catch {
      toast("error", "Failed to update workspace");
    }
  };

  const handleAddRateItem = async () => {
    if (!newItemName.trim() || !newItemRate) return;
    try {
      await createRateCardItem.mutateAsync({
        name: newItemName.trim(),
        rateInCents: Math.round(parseFloat(newItemRate) * 100),
        unit: newItemUnit,
      });
      toast("success", "Rate card item added");
      setNewItemName("");
      setNewItemRate("");
    } catch {
      toast("error", "Failed to add item");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Settings</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Manage your workspace configuration
        </p>
      </div>

      <div className="space-y-6">
        {/* Workspace */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-[rgb(var(--text-muted))]" />
              <CardTitle>Workspace</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                  Workspace Name
                </label>
                <Input
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="Your workspace name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                  Plan
                </label>
                <Badge status="active">{workspace?.plan ?? "solo"}</Badge>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-[rgb(var(--border-default))]"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-32"
                    placeholder="#0F6E56"
                  />
                  <div
                    className="h-10 flex-1 rounded-lg"
                    style={{ backgroundColor: brandColor }}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => void handleSaveWorkspace()}
                  disabled={updateWorkspace.isPending}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {updateWorkspace.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[rgb(var(--text-muted))]" />
              <CardTitle>Rate Card</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRateCard ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                {rateCardItems.length > 0 && (
                  <div className="mb-4 divide-y divide-[rgb(var(--border-default))] rounded-lg border border-[rgb(var(--border-default))]">
                    {rateCardItems.map((item: { id: string; name: string; rateInCents: number; unit?: string }) => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                            {item.name}
                          </p>
                          {item.unit && (
                            <p className="text-xs text-[rgb(var(--text-muted))]">per {item.unit}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                          ${(item.rateInCents / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">Service</label>
                    <Input
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="e.g. UI Design"
                    />
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">Rate ($)</label>
                    <Input
                      type="number"
                      value={newItemRate}
                      onChange={(e) => setNewItemRate(e.target.value)}
                      placeholder="150"
                    />
                  </div>
                  <div className="w-24">
                    <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">Unit</label>
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
                  <Button
                    size="sm"
                    onClick={() => void handleAddRateItem()}
                    disabled={!newItemName.trim() || !newItemRate || createRateCardItem.isPending}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reminder Settings */}
        <div>
          <ReminderSettings
            onSave={async () => {
              // TODO: Save to workspace settings
            }}
          />
        </div>
      </div>
    </div>
  );
}
