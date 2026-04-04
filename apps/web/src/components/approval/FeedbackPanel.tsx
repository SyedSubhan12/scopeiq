"use client";

import { useState } from "react";
import { MessageSquare, CheckCircle2, Send, X } from "lucide-react";
import { Button, Input, useToast } from "@novabots/ui";
import { useCreateFeedback, useResolveFeedback, type FeedbackItem } from "@/hooks/useFeedback";

interface FeedbackPanelProps {
  deliverableId: string;
  pins: FeedbackItem[];
  activePinId?: string | null;
  onClose: () => void;
}

export function FeedbackPanel({
  deliverableId,
  pins,
  activePinId,
  onClose,
}: FeedbackPanelProps) {
  const { toast } = useToast();
  const createFeedback = useCreateFeedback(deliverableId);
  const resolveFeedback = useResolveFeedback(deliverableId);

  const [newComment, setNewComment] = useState("");

  const sortedPins = [...pins].sort((a, b) => a.pin_number - b.pin_number);

  const handleSubmitGeneral = async () => {
    if (!newComment.trim()) return;
    try {
      await createFeedback.mutateAsync({
        x_pos: 0,
        y_pos: 0,
        content: newComment.trim(),
        author_type: "agency",
      });
      setNewComment("");
      toast("success", "Feedback added");
    } catch {
      toast("error", "Failed to add feedback");
    }
  };

  const handleResolve = async (feedbackId: string) => {
    try {
      await resolveFeedback.mutateAsync(feedbackId);
      toast("success", "Pin resolved");
    } catch {
      toast("error", "Failed to resolve");
    }
  };

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-[rgb(var(--border-default))] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--border-default))] px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[rgb(var(--text-muted))]" />
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            Feedback ({pins.length})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Pin list */}
      <div className="flex-1 overflow-y-auto">
        {sortedPins.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-[rgb(var(--text-muted))]" />
            <p className="text-sm text-[rgb(var(--text-muted))]">
              No feedback yet. Place pins on the deliverable to start.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgb(var(--border-default))]">
            {sortedPins.map((pin) => (
              <div
                key={pin.id}
                className={`p-3 transition-colors ${
                  activePinId === pin.id ? "bg-primary/5" : "hover:bg-[rgb(var(--surface-subtle))]"
                } ${pin.is_resolved ? "opacity-60" : ""}`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        pin.is_resolved
                          ? "bg-gray-200 text-gray-500"
                          : "bg-primary text-white"
                      }`}
                    >
                      {pin.pin_number}
                    </span>
                    <span className="text-xs capitalize text-[rgb(var(--text-muted))]">
                      {pin.author_type}
                    </span>
                  </div>
                  {!pin.is_resolved && (
                    <button
                      onClick={() => void handleResolve(pin.id)}
                      disabled={resolveFeedback.isPending}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Resolve
                    </button>
                  )}
                  {pin.is_resolved && (
                    <span className="text-xs text-green-600">Resolved</span>
                  )}
                </div>
                <p className="text-sm text-[rgb(var(--text-primary))]">{pin.content}</p>
                <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                  {new Date(pin.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add general feedback */}
      <div className="border-t border-[rgb(var(--border-default))] p-3">
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleSubmitGeneral()}
            placeholder="Add general feedback..."
            className="flex-1 rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Button
            size="sm"
            onClick={() => void handleSubmitGeneral()}
            disabled={!newComment.trim() || createFeedback.isPending}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
