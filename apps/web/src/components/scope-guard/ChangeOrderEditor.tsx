"use client";

import { useState } from "react";
import { FileText, DollarSign, Clock, Send, Eye, Calculator, X } from "lucide-react";
import { Card, Badge, Button, Input, Textarea, Dialog, useToast } from "@novabots/ui";
import { useCreateChangeOrder, useUpdateChangeOrder, type ChangeOrderLineItem } from "@/hooks/change-orders";
import { cn } from "@novabots/ui";

interface ChangeOrderEditorProps {
  projectId: string;
  scopeFlagId?: string;
  open: boolean;
  onClose: () => void;
  existingId?: string;
  existingData?: {
    title: string;
    description: string;
    amount: number | null;
    lineItemsJson?: ChangeOrderLineItem[];
  };
}

interface LineItem extends ChangeOrderLineItem {
  id: string;
}

function ensureLineItems(items?: ChangeOrderLineItem[]): LineItem[] {
  if (!items || items.length === 0) {
    return [{ id: crypto.randomUUID(), description: "", hours: 0, rate: 0 }];
  }

  return items.map((item) => ({
    id: item.id ?? crypto.randomUUID(),
    description: item.description,
    hours: item.hours,
    rate: item.rate,
  }));
}

export function ChangeOrderEditor({
  projectId,
  scopeFlagId,
  open,
  onClose,
  existingId,
  existingData,
}: ChangeOrderEditorProps) {
  const { toast } = useToast();
  const createCO = useCreateChangeOrder();
  const updateCO = useUpdateChangeOrder(existingId ?? "");

  const [title, setTitle] = useState(existingData?.title ?? "");
  const [description, setDescription] = useState(existingData?.description ?? "");
  const [lineItems, setLineItems] = useState<LineItem[]>(ensureLineItems(existingData?.lineItemsJson));
  const [revisedTimeline, setRevisedTimeline] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = lineItems.reduce((sum, item) => sum + item.hours * item.rate, 0);
  const totalHours = lineItems.reduce((sum, item) => sum + item.hours, 0);

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", hours: 0, rate: 0 },
    ]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (sendToClient: boolean) => {
    if (!title.trim()) {
      toast("error", "Please provide a title");
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingId) {
        const patchData: {
          title: string;
          description?: string;
          amount: number;
          lineItemsJson: LineItem[];
          revisedTimeline?: string;
          status?: "sent";
        } = {
          title: title.trim(),
          amount: totalAmount,
          lineItemsJson: lineItems,
        };
        if (description.trim()) patchData.description = description.trim();
        if (revisedTimeline.trim()) patchData.revisedTimeline = revisedTimeline.trim();
        if (sendToClient) patchData.status = "sent";
        await updateCO.mutateAsync(patchData);
        toast("success", sendToClient ? "Change order sent to client" : "Change order saved");
      } else {
        const createData: {
          projectId: string;
          scopeFlagId?: string;
          title: string;
          description?: string;
          amount: number;
          lineItemsJson?: LineItem[];
          revisedTimeline?: string;
        } = {
          projectId,
          title: title.trim(),
          amount: totalAmount,
        };
        if (scopeFlagId) createData.scopeFlagId = scopeFlagId;
        if (description.trim()) createData.description = description.trim();
        if (revisedTimeline.trim()) createData.revisedTimeline = revisedTimeline.trim();
        createData.lineItemsJson = lineItems;
        await createCO.mutateAsync(createData);
        toast("success", sendToClient ? "Change order created and sent" : "Change order created");
      }
      onClose();
    } catch {
      toast("error", "Failed to save change order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle(existingData?.title ?? "");
    setDescription(existingData?.description ?? "");
    setLineItems(ensureLineItems(existingData?.lineItemsJson));
    setRevisedTimeline("");
    setShowPreview(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {
          if (!isSubmitting) {
            resetForm();
            onClose();
          }
        }}
        title={existingId ? "Edit Change Order" : "Create Change Order"}
      >
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Additional Landing Page Design"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Work Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the additional work..."
              rows={3}
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--text-primary))]">
                <Calculator className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                Line Items
              </label>
              <Button size="sm" variant="ghost" onClick={addLineItem}>
                + Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <div key={item.id} className="flex items-start gap-2">
                  <span className="mt-2 w-5 text-center text-xs font-medium text-[rgb(var(--text-muted))]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                      placeholder="Description"
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Clock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                        <input
                          type="number"
                          value={item.hours || ""}
                          onChange={(e) => updateLineItem(item.id, "hours", parseFloat(e.target.value) || 0)}
                          placeholder="Hours"
                          min={0}
                          className="w-full rounded-xl border border-[rgb(var(--border-default))] bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="relative flex-1">
                        <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                        <input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                          placeholder="Rate/hr"
                          min={0}
                          className="w-full rounded-xl border border-[rgb(var(--border-default))] bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="flex w-24 items-center rounded-xl bg-[rgb(var(--surface-subtle))] px-3 text-sm font-semibold text-[rgb(var(--text-primary))]">
                        ${(item.hours * item.rate).toLocaleString()}
                      </div>
                      {lineItems.length > 1 && (
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="mt-1 rounded p-1 text-[rgb(var(--text-muted))] hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[rgb(var(--surface-subtle))] px-4 py-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[rgb(var(--text-muted))]">
                  <Clock className="mr-1 inline h-3.5 w-3.5" />
                  {totalHours}h estimated
                </span>
              </div>
              <span className="text-lg font-bold text-[rgb(var(--text-primary))]">
                ${totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Revised Timeline */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Revised Timeline (optional)
            </label>
            <Input
              value={revisedTimeline}
              onChange={(e) => setRevisedTimeline(e.target.value)}
              placeholder="e.g. +2 weeks, new deadline: March 15"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-[rgb(var(--border-subtle))] pt-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPreview(true)}
              disabled={!title.trim()}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Preview
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleSubmit(false)}
                disabled={isSubmitting}
              >
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSubmit(true)}
                disabled={isSubmitting || !title.trim()}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {isSubmitting ? "Sending..." : "Send to Client"}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} title="Preview — Client View">
        <div className="space-y-4">
          <Card className="border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">
                Change Order Request
              </h3>
            </div>
            <h4 className="text-base font-bold text-[rgb(var(--text-primary))]">{title || "Untitled"}</h4>
            {description && (
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{description}</p>
            )}
          </Card>

          {lineItems.filter((i) => i.description || i.hours > 0).length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                Line Items
              </p>
              <div className="divide-y divide-[rgb(var(--border-subtle))] rounded-xl border border-[rgb(var(--border-subtle))]">
                {lineItems
                  .filter((i) => i.description || i.hours > 0)
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                          {item.description || "Unnamed item"}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-muted))]">
                          {item.hours}h @ ${item.rate}/hr
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[rgb(var(--text-primary))]">
                        ${(item.hours * item.rate).toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-subtle))] px-4 py-3">
            <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">Total</span>
            <span className="text-xl font-bold text-[rgb(var(--text-primary))]">
              ${totalAmount.toLocaleString()}
            </span>
          </div>

          {revisedTimeline && (
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
              <Clock className="h-4 w-4 text-[rgb(var(--text-muted))]" />
              <span>Revised timeline: {revisedTimeline}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
