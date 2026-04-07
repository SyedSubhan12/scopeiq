"use client";

import { useState } from "react";
import { Bell, Save, Clock } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  useToast,
} from "@novabots/ui";

interface ReminderStep {
  label: string;
  description: string;
  defaultHours: number;
  minHours: number;
  maxHours: number;
}

const REMINDER_STEPS: ReminderStep[] = [
  {
    label: "First Reminder",
    description: "Gentle nudge to review the pending item",
    defaultHours: 48,
    minHours: 1,
    maxHours: 168,
  },
  {
    label: "Second Reminder",
    description: "Stronger reminder with increased urgency",
    defaultHours: 96,
    minHours: 24,
    maxHours: 336,
  },
  {
    label: "Final Notice",
    description: "Last reminder before auto-approval or escalation",
    defaultHours: 168,
    minHours: 48,
    maxHours: 720,
  },
];

interface ReminderConfig {
  steps: { hours: number }[];
  autoApproveOnSilence: boolean;
}

function loadFromStorage(): ReminderConfig | null {
  try {
    const raw = localStorage.getItem("scopeiq-reminder-settings");
    if (raw) {
      return JSON.parse(raw) as ReminderConfig;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveToStorage(config: ReminderConfig) {
  try {
    localStorage.setItem("scopeiq-reminder-settings", JSON.stringify(config));
  } catch {
    // ignore
  }
}

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (rem === 0) return `${days} day${days !== 1 ? "s" : ""}`;
  return `${days}d ${rem}h`;
}

export default function RemindersSettingsPage() {
  const { toast } = useToast();
  const saved = loadFromStorage();

  const initialSteps =
    saved?.steps.map((s) => s.hours) ?? [48, 96, 168];
  const initialAutoApprove = saved?.autoApproveOnSilence ?? true;

  const [steps, setSteps] = useState<[number, number, number]>([
    initialSteps[0] ?? 48,
    initialSteps[1] ?? 96,
    initialSteps[2] ?? 168,
  ]);
  const [autoApprove, setAutoApprove] = useState(initialAutoApprove);
  const [saving, setSaving] = useState(false);

  const updateStep = (index: number, value: number) => {
    const stepConfig = REMINDER_STEPS[index];
    if (!stepConfig) return;
    const clamped = Math.min(
      stepConfig.maxHours,
      Math.max(stepConfig.minHours, value),
    );
    const updated = [...steps] as [number, number, number];
    updated[index] = clamped;
    setSteps(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config: ReminderConfig = {
        steps: steps.map((h) => ({ hours: h })),
        autoApproveOnSilence: autoApprove,
      };
      saveToStorage(config);
      toast("success", "Reminder settings saved");
    } catch {
      toast("error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[rgb(var(--text-muted))]" />
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            Reminders
          </h1>
        </div>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Configure the default reminder schedule for approval requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[rgb(var(--text-muted))]" />
            <CardTitle>Reminder Schedule</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Reminder steps */}
            <div className="space-y-5">
              {REMINDER_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {step.label}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      {step.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        value={steps[i]}
                        onChange={(e) =>
                          updateStep(
                            i,
                            Math.max(
                              step.minHours,
                              parseInt(e.target.value) || 0,
                            ),
                          )
                        }
                        className="w-24 rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-right text-sm outline-none focus:border-primary"
                        min={step.minHours}
                        max={step.maxHours}
                      />
                      <span className="text-xs text-[rgb(var(--text-muted))]">
                        hours
                      </span>
                      <span className="ml-2 rounded-md bg-[rgb(var(--surface-subtle))] px-2 py-1 text-xs text-[rgb(var(--text-secondary))]">
                        = {formatDuration(steps[i] ?? step.defaultHours)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-[rgb(var(--border-subtle))]" />

            {/* Auto-approve toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  Auto-approve on silence
                </p>
                <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">
                  Automatically approve requests if no response is received after
                  the final reminder
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/35 peer-focus-visible:ring-offset-2" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
                Schedule Summary
              </p>
              <div className="space-y-1.5 text-sm text-[rgb(var(--text-secondary))]">
                <p>
                  <span className="font-medium text-[rgb(var(--text-primary))]">
                    Step 1:
                  </span>{" "}
                  {formatDuration(steps[0])} after request
                </p>
                <p>
                  <span className="font-medium text-[rgb(var(--text-primary))]">
                    Step 2:
                  </span>{" "}
                  {formatDuration(steps[1])} after request
                </p>
                <p>
                  <span className="font-medium text-[rgb(var(--text-primary))]">
                    Step 3:
                  </span>{" "}
                  {formatDuration(steps[2])} after request
                  {autoApprove && (
                    <span className="ml-1 text-primary">{" -> "}auto-approve</span>
                  )}
                </p>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
