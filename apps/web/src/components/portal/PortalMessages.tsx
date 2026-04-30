"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Paperclip, MessageSquare, Check, CheckCheck, Loader2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePortalHeaders } from "@/lib/portal-auth";
import { StatusPill } from "@/components/ui/StatusPill";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const SYSTEM_MESSAGE_BODY =
  "This request appears to fall outside our current agreement. Your team has been notified and will follow up with options.";

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface PortalMessage {
  id: string;
  project_id: string;
  author_type: "agency" | "client" | "system";
  author_id: string | null;
  author_name: string | null;
  body: string;
  status: string;
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
  projectId: string;
}

const TIME_GROUP_GAP_MS = 5 * 60 * 1000;

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDay === 0) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function shouldShowTimestamp(current: PortalMessage, prev: PortalMessage | undefined): boolean {
  if (!prev) return true;
  if (prev.author_type !== current.author_type) return true;
  const gap = new Date(current.created_at).getTime() - new Date(prev.created_at).getTime();
  return gap > TIME_GROUP_GAP_MS;
}

function getScopeStatus(msg: PortalMessage): string | null {
  if (msg.author_type !== "client") return null;
  if (msg.status === "flagged") return "flagged";
  if (msg.scope_check_status === "pending") return "pending_check";
  if (msg.status === "checked") return "checked";
  return null;
}

function SystemBubble({ msg }: { msg: PortalMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center gap-1.5"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-[75%] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 shadow-sm">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
            <p className="mt-1.5 text-[11px] italic text-amber-600/70">
              ScopeIQ system message
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({
  msg,
  brandColor,
  clientName,
  agencyName,
  showTimestamp,
}: {
  msg: PortalMessage;
  brandColor: string;
  clientName: string;
  agencyName: string;
  showTimestamp: boolean;
}) {
  if (msg.author_type === "system") {
    return <SystemBubble msg={msg} />;
  }

  const isClient = msg.author_type === "client";
  const displayName = msg.author_name ?? (isClient ? clientName : agencyName);
  const isRead = msg.read_at != null;
  const scopeStatus = getScopeStatus(msg);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col gap-1 ${isClient ? "items-end" : "items-start"}`}
    >
      {showTimestamp && (
        <div className={`flex items-center gap-2 text-[11px] text-[rgb(var(--text-muted))] ${isClient ? "flex-row-reverse" : ""}`}>
          <span className="font-medium text-[rgb(var(--text-secondary))]">
            {displayName}
          </span>
          <span>{formatTimestamp(msg.created_at)}</span>
          {scopeStatus && (
            <AnimatePresence mode="wait">
              <motion.span
                key={scopeStatus}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <StatusPill
                  status={scopeStatus}
                  size="sm"
                  className={scopeStatus === "pending_check" ? "animate-pulse" : ""}
                />
              </motion.span>
            </AnimatePresence>
          )}
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isClient
            ? "rounded-tr-sm text-white"
            : "rounded-tl-sm bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-primary))]"
        }`}
        style={isClient ? { backgroundColor: brandColor } : undefined}
      >
        {msg.body !== "(attachment)" && (
          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
        )}

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

      {!isClient && !showTimestamp && null}
      {!isClient && isRead && (
        <div className="flex items-center gap-1 text-[11px] text-[rgb(var(--text-muted))]">
          <CheckCheck className="h-3 w-3 text-green-500" />
          <span>Read</span>
        </div>
      )}
      {!isClient && !isRead && showTimestamp && (
        <div className="flex items-center gap-1 text-[11px] text-[rgb(var(--text-muted))]">
          <Check className="h-3 w-3" />
          <span>Delivered</span>
        </div>
      )}
    </motion.div>
  );
}

export function PortalMessages({
  portalToken,
  brandColor,
  clientName,
  agencyName = "Agency",
  projectId,
}: PortalMessagesProps) {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const supabaseChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

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

  // Supabase real-time subscription for new messages
  useEffect(() => {
    if (!projectId || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const channel = supabase
      .channel(`portal-messages-${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        () => { void fetchMessages(); },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        () => { void fetchMessages(); },
      )
      .subscribe();

    supabaseChannelRef.current = channel;
    return () => {
      if (supabaseChannelRef.current) {
        void supabase.removeChannel(supabaseChannelRef.current);
        supabaseChannelRef.current = null;
      }
    };
  }, [projectId, fetchMessages]);

  // Scroll to bottom after first load
  useEffect(() => {
    if (!loading) {
      scrollToBottom("instant");
    }
  }, [loading, scrollToBottom]);

  // Scroll on new messages only if user is near bottom
  useEffect(() => {
    if (messages.length > 0 && isNearBottom()) {
      scrollToBottom("smooth");
    }
  }, [messages.length, scrollToBottom, isNearBottom]);

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

    const newAttachments: Attachment[] = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
      type: f.type || "application/octet-stream",
    }));
    setPendingAttachments((prev) => [...prev, ...newAttachments].slice(0, 10));
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
    <div
      className="flex flex-col rounded-2xl border border-[rgb(var(--border-default))] bg-white overflow-hidden"
      style={{ height: "clamp(400px, 60vh, 680px)" }}
    >
      {/* Message list */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-5"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))] mb-4">
              <MessageSquare className="h-7 w-7 text-[rgb(var(--text-muted))]" />
            </div>
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              No messages yet
            </h3>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))] max-w-xs">
              Send your first message to start the project conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, i) => {
              const prev = i > 0 ? messages[i - 1] : undefined;
              const showTs = shouldShowTimestamp(msg, prev);
              const isNewGroup = showTs && i > 0;

              return (
                <div
                  key={msg.id}
                  className={isNewGroup ? "pt-3" : "pt-1"}
                >
                  <MessageBubble
                    msg={msg}
                    brandColor={brandColor}
                    clientName={clientName ?? "You"}
                    agencyName={agencyName}
                    showTimestamp={showTs}
                  />
                </div>
              );
            })}
          </div>
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

      {/* Input area — pinned bottom, mobile-optimized */}
      <div className="border-t border-[rgb(var(--border-default))] px-3 py-2.5 sm:px-4 sm:py-3 flex items-end gap-2 bg-white">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-label="Attach files"
        />

        <button
          type="button"
          aria-label="Attach file"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-secondary))] transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] px-3 py-2 text-sm leading-relaxed text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:border-transparent focus:outline-none focus:ring-2 transition-all"
          style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
        />

        <button
          type="button"
          aria-label="Send message"
          disabled={sending || (body.trim().length === 0 && pendingAttachments.length === 0)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
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
