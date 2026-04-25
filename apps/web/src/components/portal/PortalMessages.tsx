"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Paperclip, MessageSquare, Check, CheckCheck, Loader2 } from "lucide-react";
import { generatePortalHeaders } from "@/lib/portal-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface PortalMessage {
  id: string;
  project_id: string;
  author_type: "agency" | "client";
  author_id: string | null;
  author_name: string | null;
  body: string;
  attachments_json: Attachment[] | null;
  thread_id: string | null;
  read_at: string | null;
  scope_check_status: string;
  created_at: string;
}

interface PortalMessagesProps {
  portalToken: string;
  brandColor: string;
  clientName?: string | null;
  agencyName?: string;
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PortalMessages({
  portalToken,
  brandColor,
  clientName,
  agencyName = "Agency",
}: PortalMessagesProps) {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/portal/messages?limit=100`, {
        headers: generatePortalHeaders(portalToken),
      });
      if (!res.ok) throw new Error("Failed to load messages");
      const json = await res.json() as { data: PortalMessage[] };
      setMessages(json.data);

      // Mark unread agency messages as read
      const unreadAgencyMessages = json.data.filter(
        (m: PortalMessage) => m.author_type === "agency" && m.read_at == null,
      );
      for (const m of unreadAgencyMessages) {
        void fetch(`${API_BASE_URL}/portal/messages/${m.id}/read`, {
          method: "POST",
          headers: generatePortalHeaders(portalToken),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [portalToken]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  // Scroll to bottom after first load
  useEffect(() => {
    if (!loading) {
      scrollToBottom("instant");
    }
  }, [loading, scrollToBottom]);

  // Scroll to bottom whenever messages grow
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages.length, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [body]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed && pendingAttachments.length === 0) return;
    if (sending) return;

    setSending(true);
    setSendError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/portal/messages`, {
        method: "POST",
        headers: generatePortalHeaders(portalToken),
        body: JSON.stringify({
          body: trimmed || "(attachment)",
          attachmentsJson: pendingAttachments.length > 0 ? pendingAttachments : null,
          authorName: clientName ?? undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(errJson?.error?.message ?? "Failed to send message");
      }

      const json = await res.json() as { data: PortalMessage };
      setMessages((prev) => [...prev, json.data]);
      setBody("");
      setPendingAttachments([]);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // Presigned URL upload would go here in production.
    // For now we store the file metadata with a placeholder URL.
    const newAttachments: Attachment[] = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
      type: f.type || "application/octet-stream",
    }));
    setPendingAttachments((prev) => [...prev, ...newAttachments].slice(0, 10));

    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--text-muted))]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-[rgb(var(--border-default))] bg-white overflow-hidden"
      style={{ height: "clamp(400px, 60vh, 680px)" }}
    >
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))] mb-4">
              <MessageSquare className="h-7 w-7 text-[rgb(var(--text-muted))]" />
            </div>
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              No messages yet
            </h3>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))] max-w-xs">
              Start the conversation. Your agency will be notified of your message.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isClient = msg.author_type === "client";
            const displayName =
              msg.author_name ?? (isClient ? (clientName ?? "You") : agencyName);
            const isRead = msg.read_at != null;

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${isClient ? "items-end" : "items-start"}`}
              >
                {/* Author + time */}
                <div className={`flex items-center gap-2 text-xs text-[rgb(var(--text-muted))] ${isClient ? "flex-row-reverse" : ""}`}>
                  <span className="font-medium text-[rgb(var(--text-secondary))]">
                    {displayName}
                  </span>
                  <span>{formatRelativeTime(msg.created_at)}</span>
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isClient
                      ? "rounded-tr-sm text-white"
                      : "rounded-tl-sm bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-primary))]"
                  }`}
                  style={
                    isClient
                      ? { backgroundColor: brandColor }
                      : undefined
                  }
                >
                  {msg.body !== "(attachment)" && (
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  )}

                  {/* Attachments */}
                  {msg.attachments_json && msg.attachments_json.length > 0 && (
                    <div className={`mt-2 space-y-1.5 ${msg.body !== "(attachment)" ? "border-t pt-2 border-white/20" : ""}`}>
                      {msg.attachments_json.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                            isClient
                              ? "bg-white/10 hover:bg-white/20 text-white"
                              : "bg-white hover:bg-gray-50 text-[rgb(var(--text-primary))] border border-[rgb(var(--border-default))]"
                          }`}
                        >
                          <Paperclip className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[160px]">{att.name}</span>
                          <span className="shrink-0 opacity-60">{formatBytes(att.size)}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Read receipt — only shown for agency messages (i.e. messages the client can mark as read) */}
                {!isClient && (
                  <div className="flex items-center gap-1 text-xs text-[rgb(var(--text-muted))]">
                    {isRead ? (
                      <>
                        <CheckCheck className="h-3 w-3 text-green-500" />
                        <span>Read</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Delivered</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <div className="border-t border-[rgb(var(--border-default))] px-4 py-2 flex flex-wrap gap-2 bg-[rgb(var(--surface-subtle))]">
          {pendingAttachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-lg bg-white border border-[rgb(var(--border-default))] px-2.5 py-1 text-xs"
            >
              <Paperclip className="h-3 w-3 text-[rgb(var(--text-muted))]" />
              <span className="max-w-[120px] truncate text-[rgb(var(--text-secondary))]">
                {att.name}
              </span>
              <button
                type="button"
                aria-label={`Remove ${att.name}`}
                className="ml-0.5 text-[rgb(var(--text-muted))] hover:text-red-500 transition-colors"
                onClick={() => setPendingAttachments((prev) => prev.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Send error */}
      {sendError && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
          {sendError}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-[rgb(var(--border-default))] px-4 py-3 flex items-end gap-2 bg-white">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-label="Attach files"
        />

        {/* Attach button */}
        <button
          type="button"
          aria-label="Attach file"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-secondary))] transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] px-3 py-2 text-sm leading-relaxed text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:border-transparent focus:outline-none focus:ring-2 transition-all"
          style={
            { "--tw-ring-color": brandColor } as React.CSSProperties
          }
        />

        {/* Send button */}
        <button
          type="button"
          aria-label="Send message"
          disabled={sending || (body.trim().length === 0 && pendingAttachments.length === 0)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: brandColor }}
          onClick={() => void handleSend()}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
