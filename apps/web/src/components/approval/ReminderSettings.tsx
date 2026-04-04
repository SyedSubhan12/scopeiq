"use client";

import { useState } from "react";
import { Bell, Save } from "lucide-react";
import { Button, Card, Input, useToast } from "@novabots/ui";

interface ReminderSettingsProps {
  initialSteps?: [number, number, number]; // hours
  autoApprove?: boolean;
  onSave: (steps: [number, number, number], autoApprove: boolean) => Promise<void>;
}

const STEP_LABELS = [
  { label: "Gentle Nudge", description: "Friendly reminder to review" },
  { label: "Deadline Warning", description: "Stronger reminder with urgency" },
  { label: "Silence Approval Warning", description: "Final notice before auto-approve" },
];

export function ReminderSettings({
  initialSteps = [48, 96, 168],
  autoApprove: initialAutoApprove = true,
  onSave,
}: ReminderSettingsProps) {
  const { toast } = useToast();
  const [steps, setSteps] = useState<[number, number, number]>(initialSteps);
  const [autoApprove, setAutoApprove] = useState(initialAutoApprove);
  const [saving, setSaving] = useState(false);

  const updateStep = (index: number, value: number) => {
    const updated = [...steps] as [number, number, number];
    updated[index] = value;
    setSteps(updated);
  };

  const formatDuration = (hours: number): string => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(steps, autoApprove);
      toast("success", "Reminder settings saved");
    } catch {
      toast("error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-[rgb(var(--text-muted))]" />
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          Reminder Schedule
        </h3>
      </div>

      <div className="space-y-4">
        {STEP_LABELS.map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                {step.label}
              </p>
              <p className="text-xs text-[rgb(var(--text-muted))]">{step.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={steps[i]}
                onChange={(e) => updateStep(i, Math.max(1, parseInt(e.target.value) || 0))}
                className="w-20 rounded-lg border border-[rgb(var(--border-default))] px-2 py-1.5 text-right text-sm outline-none focus:border-primary"
                min={1}
              />
              <span className="text-xs text-[rgb(var(--text-muted))]">hours</span>
            </div>
          </div>
        ))}

        {/* Auto-approve toggle */}
        <div className="flex items-center justify-between border-t border-[rgb(var(--border-default))] pt-4">
          <div>
            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
              Auto-approve on silence
            </p>
            <p className="text-xs text-[rgb(var(--text-muted))]">
              Approve after 48h with no response to final reminder
            </p>
          </div>
          <label className="relative cursor-pointer">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`h-5 w-9 rounded-full transition-colors ${
                autoApprove ? "bg-primary" : "bg-gray-200"
              }`}
            />
            <div
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                autoApprove ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </Card>
  );
}
