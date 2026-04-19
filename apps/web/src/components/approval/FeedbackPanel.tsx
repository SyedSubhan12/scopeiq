"use client";

import { useState } from "react";
import { MessageSquare, CheckCircle2, Send, X, Reply } from "lucide-react";
import { Button, useToast } from "@novabots/ui";
import { useCreateFeedback, useResolveFeedback, useReplyFeedback, type FeedbackItem } from "@/hooks/useFeedback";

interface FeedbackPanelProps {
  deliverableId: string;
  pins: FeedbackItem[];
  activePinId?: string | null;
  onActivePinChange?: (id: string | null) => void;
  onClose: () => void;
  createMutation: {
    mutateAsync: (data: { body: string; annotationJson?: FeedbackItem["annotationJson"] }) => Promise<unknown>;
    isPending: boolean;
  };
  resolveMutation: {
    mutateAsync: (feedbackId: string) => Promise<unknown>;
    isPending: boolean;
  };
}

function FeedbackPin({
  pin,
  isResolved,
  onResolve,
  replies,
}: {
  pin: FeedbackItem;
  isResolved: boolean;
  onResolve: (feedbackId: string) => void;
  replies: FeedbackItem[];
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const replyMutation = useReplyFeedback(pin.deliverableId, pin.id);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await replyMutation.mutateAsync(replyText.trim());
      setReplyText("");
      setShowReply(false);
    } catch {
      // handled by caller
    }
  };

  const annotation = pin.annotationJson;

  return (
    <div className={`p-3 transition-colors ${isResolved ? "opacity-60" : ""}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              isResolved ? "bg-gray-200 text-gray-500" : "bg-primary text-white"
            }`}
          >
            {annotation?.pinNumber ?? "!"}
          </span>
          <span className="text-xs font-medium text-[rgb(var(--text-muted))]">
            {pin.authorName || "User"}
          </span>
        </div>
        {!isResolved && (
          <button
            onClick={() => onResolve(pin.id)}
            disabled={false}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-green-600 hover:bg-green-50"
          >
            <CheckCircle2 className="h-3 w-3" />
            Resolve
          </button>
        )}
        {isResolved && (
          <span className="text-xs text-green-600">Resolved</span>
        )}
      </div>
      <p className="text-sm text-[rgb(var(--text-primary))]">{pin.body}</p>
      <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
        {new Date(pin.createdAt).toLocaleString()}
      </p>

      {/* Threaded replies */}
      {replies.length > 0 && (
        <div className="mt-2 ml-3 border-l-2 border-[rgb(var(--border-subtle))] pl-3">
          {replies.map((reply) => (
            <div key={reply.id} className="py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  {reply.authorName || "User"}
                </span>
                <span className="text-[10px] text-[rgb(var(--text-muted))]">
                  {new Date(reply.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[rgb(var(--text-secondary))]">{reply.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply button + input */}
      <div className="mt-2 flex items-center gap-2">
        {!showReply ? (
          <button
            onClick={() => setShowReply(true)}
            className="flex items-center gap-1 text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]"
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>
        ) : (
          <div className="flex w-full gap-1.5">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleReply()}
              placeholder="Write a reply..."
              className="flex-1 rounded-lg border border-[rgb(var(--border-default))] px-2.5 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => void handleReply()}
              disabled={!replyText.trim() || replyMutation.isPending}
              className="px-2 py-1 text-xs"
            >
              <Send className="h-3 w-3" />
            </Button>
            <button
              onClick={() => {
                setShowReply(false);
                setReplyText("");
              }}
              className="rounded p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FeedbackPanel({
  deliverableId,
  pins,
  activePinId,
  onActivePinChange,
  onClose,
  createMutation,
  resolveMutation,
}: FeedbackPanelProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");

  // Separate root pins (no parentId) from replies
  const rootPins = pins.filter((p) => !p.parentId);
  const repliesByParent = pins.reduce<Record<string, FeedbackItem[]>>((acc, pin) => {
    const parentId = pin.parentId;
    if (parentId) {
      const replies = acc[parentId] ?? (acc[parentId] = []);
      replies.push(pin);
    }
    return acc;
  }, {});

  const sortedPins = [...rootPins].sort((a, b) => {
    const aNum = a.annotationJson?.pinNumber ?? 999;
    const bNum = b.annotationJson?.pinNumber ?? 999;
    return aNum - bNum;
  });

  const handleSubmitGeneral = async () => {
    if (!newComment.trim()) return;
    try {
      await createMutation.mutateAsync({
        body: newComment.trim(),
        annotationJson: {
          xPos: 0,
          yPos: 0,
          pinNumber: rootPins.length + 1,
        },
      });
      setNewComment("");
      toast("success", "Feedback added");
    } catch {
      toast("error", "Failed to add feedback");
    }
  };

  const handleResolve = async (feedbackId: string) => {
    try {
      await resolveMutation.mutateAsync(feedbackId);
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
            Feedback ({rootPins.length})
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
            {sortedPins.map((pin) => {
              const isResolved = !!pin.resolvedAt;
              const pinReplies = repliesByParent[pin.id] ?? [];

              return (
                <div
                  key={pin.id}
                  onMouseEnter={() => onActivePinChange?.(pin.id)}
                  onMouseLeave={() => onActivePinChange?.(null)}
                  className={`transition-colors ${
                    activePinId === pin.id
                      ? "border-l-2 border-[#1D9E75] bg-[#1D9E75]/5"
                      : "border-l-2 border-transparent hover:bg-[rgb(var(--surface-subtle))]"
                  }`}
                >
                  <FeedbackPin
                    pin={pin}
                    isResolved={isResolved}
                    onResolve={handleResolve}
                    replies={pinReplies}
                  />
                </div>
              );
            })}
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
            disabled={!newComment.trim() || createMutation.isPending}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
