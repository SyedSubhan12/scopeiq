"use client";

import { useState, useEffect } from "react";
import { Bell, Save, Clock } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  useToast,
} from "@novabots/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/useWorkspace";
import { fetchWithAuth } from "@/lib/api";

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

const DEFAULT_CONFIG: ReminderConfig = {
  steps: [{ hours: 48 }, { hours: 96 }, { hours: 168 }],
  autoApproveOnSilence: true,
};

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (rem === 0) return `${days} day${days !== 1 ? "s" : ""}`;
  return `${days}d ${rem}h`;
}

export default function RemindersSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: workspaceData, isLoading } = useWorkspace();

  const reminderSettings: ReminderConfig =
    (workspaceData?.data?.reminderSettings as ReminderConfig | undefined) ?? DEFAULT_CONFIG;

  const [steps, setSteps] = useState<[number, number, number]>([
    reminderSettings.steps[0]?.hours ?? DEFAULT_CONFIG.steps[0].hours,
    reminderSettings.steps[1]?.hours ?? DEFAULT_CONFIG.steps[1].hours,
    reminderSettings.steps[2]?.hours ?? DEFAULT_CONFIG.steps[2].hours,
  ]);
  const [autoApprove, setAutoApprove] = useState(
    reminderSettings.autoApproveOnSilence ?? DEFAULT_CONFIG.autoApproveOnSilence,
  );

  // Sync state when workspace data loads
  useEffect(() => {
    if (workspaceData?.data?.reminderSettings) {
      const settings = workspaceData.data.reminderSettings as ReminderConfig;
      setSteps([
        settings.steps[0]?.hours ?? DEFAULT_CONFIG.steps[0].hours,
        settings.steps[1]?.hours ?? DEFAULT_CONFIG.steps[1].hours,
        settings.steps[2]?.hours ?? DEFAULT_CONFIG.steps[2].hours,
      ]);
      setAutoApprove(settings.autoApproveOnSilence ?? DEFAULT_CONFIG.autoApproveOnSilence);
    }
  }, [workspaceData]);

  const updateReminderSettings = useMutation({
    mutationFn: (settings: ReminderConfig) =>
      fetchWithAuth("/v1/workspaces/me", {
        method: "PATCH",
        body: JSON.stringify({ reminderSettings: settings }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast("success", "Reminder settings saved");
    },
    onError: () => {
      toast("error", "Failed to save settings");
    },
  });

  const updateStep = (index: number, value: number) => {
    const stepConfig = REMINDER_STEPS[index];
    const clamped = Math.min(
      stepConfig.maxHours,
      Math.max(stepConfig.minHours, value),
    );
    const updated = [...steps] as [number, number, number];
    updated[index] = clamped;
    setSteps(updated);
  };

  const handleSave = () => {
    const config: ReminderConfig = {
      steps: steps.map((h) => ({ hours: h })),
      autoApproveOnSilence: autoApprove,
    };
    updateReminderSettings.mutate(config);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[rgb(var(--surface-subtle))]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[rgb(var(--surface-subtle))]" />
        </div>
        <div className="h-64 w-full animate-pulse rounded-xl bg-[rgb(var(--surface-subtle))]" />
      </div>
    );
  }

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
                        = {formatDuration(steps[i])}
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
                onClick={handleSave}
                disabled={updateReminderSettings.isPending}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {updateReminderSettings.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
