"use client";

import { useState } from "react";
import { Bell, PauseCircle, RotateCcw, Loader2 } from "lucide-react";
import { Button, Card, Badge, useToast } from "@novabots/ui";
import { useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

interface ReminderSequenceCardProps {
  projectId: string;
  remindersPaused: boolean;
}

export function ReminderSequenceCard({ projectId, remindersPaused }: ReminderSequenceCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeAction, setActiveAction] = useState<"pause" | "reset" | null>(null);

  const handlePause = async () => {
    setActiveAction("pause");
    try {
      await fetchWithAuth(`/v1/projects/${projectId}/reminders/pause`, { method: "PATCH" });
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast("success", "Reminder sequence paused");
    } catch {
      toast("error", "Failed to pause reminder sequence");
    } finally {
      setActiveAction(null);
    }
  };

  const handleReset = async () => {
    setActiveAction("reset");
    try {
      await fetchWithAuth(`/v1/projects/${projectId}/reminders/reset`, { method: "PATCH" });
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast("success", "Reminder sequence reset");
    } catch {
      toast("error", "Failed to reset reminder sequence");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                Reminder Sequence
              </p>
              <Badge status={remindersPaused ? "pending" : "active"}>
                {remindersPaused ? "Paused" : "Active"}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">
              {remindersPaused
                ? "Client reminders are paused for this project."
                : "Client reminders are active and running on schedule."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handlePause()}
            disabled={remindersPaused || activeAction !== null}
            className="gap-1.5"
          >
            {activeAction === "pause" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PauseCircle className="h-3.5 w-3.5" />
            )}
            Pause Sequence
          </Button>
          <Button
            size="sm"
            onClick={() => void handleReset()}
            disabled={!remindersPaused || activeAction !== null}
            className="gap-1.5"
          >
            {activeAction === "reset" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Reset Sequence
          </Button>
        </div>
      </div>
    </Card>
  );
}
