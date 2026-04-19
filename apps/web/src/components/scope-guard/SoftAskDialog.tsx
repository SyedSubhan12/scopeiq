"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send, Pencil, FileText, Sparkles, Loader2 } from "lucide-react";
import { Dialog, Button, Textarea, useToast } from "@novabots/ui";
import { useSoftAskHint } from "@/hooks/useSoftAskHint";

interface SoftAskDialogProps {
  open: boolean;
  onClose: () => void;
  flagId: string;
  severity: string;
  flagTitle?: string | undefined;
  onSendAsIs?: ((suggestion: string) => Promise<void> | void) | undefined;
  onEscalate?: (() => Promise<void> | void) | undefined;
}

function WordReveal({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<string>("");

  useEffect(() => {
    if (prevRef.current === text) return;
    prevRef.current = text;
    const container = containerRef.current;
    if (!container) return;
    const words = container.querySelectorAll<HTMLSpanElement>("[data-word]");
    if (words.length === 0) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      words.forEach((w) => (w.style.opacity = "1"));
      return;
    }
    import("animejs").then(({ default: anime }) => {
      anime({
        targets: words,
        opacity: [0, 1],
        translateY: [4, 0],
        duration: 240,
        delay: anime.stagger(25),
        easing: "easeOutQuad",
      });
    });
  }, [text]);

  return (
    <div ref={containerRef} className="leading-6">
      {text.split(" ").map((word, i) => (
        <span
          key={`${i}-${word}`}
          data-word
          style={{ opacity: 0, display: "inline-block", marginRight: "0.28em" }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

export function SoftAskDialog({
  open,
  onClose,
  flagId,
  severity,
  flagTitle,
  onSendAsIs,
  onEscalate,
}: SoftAskDialogProps) {
  const { toast } = useToast();
  const softAsk = useSoftAskHint(flagId, severity);
  const [suggestion, setSuggestion] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const [sending, setSending] = useState(false);

  // Fetch a suggestion when dialog opens
  useEffect(() => {
    if (!open) return;
    setEditing(false);
    setSending(false);
    softAsk.mutate(undefined, {
      onSuccess: (data) => {
        setSuggestion(data.suggestion);
        setDraft(data.suggestion);
        setConfidence(data.confidence);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flagId]);

  const loading = softAsk.isPending;
  const activeText = editing ? draft : suggestion;

  const handleSend = async () => {
    if (!activeText.trim()) return;
    setSending(true);
    try {
      if (onSendAsIs) await onSendAsIs(activeText.trim());
      toast("success", "Quick note sent");
      onClose();
    } catch {
      toast("error", "Failed to send quick note");
    } finally {
      setSending(false);
    }
  };

  const handleEscalate = async () => {
    setSending(true);
    try {
      if (onEscalate) await onEscalate();
      onClose();
    } catch {
      toast("error", "Failed to open change order");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Quick Note">
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-[#1D9E75]/20 bg-[#1D9E75]/5 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#1D9E75]" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#1D9E75]">
              AI-suggested response
            </p>
            {flagTitle ? (
              <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))] line-clamp-1">
                for: {flagTitle}
              </p>
            ) : null}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-xl border border-[rgb(var(--border-subtle))] bg-white p-4"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
              <Loader2 className="h-4 w-4 animate-spin text-[#1D9E75]" />
              Drafting a friendly reply…
            </div>
          ) : editing ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Your reply to the client…"
            />
          ) : (
            <div className="text-sm text-[rgb(var(--text-primary))]">
              <WordReveal text={suggestion || "I'll put together a quick quote."} />
            </div>
          )}
          {!loading && confidence > 0 ? (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[rgb(var(--text-muted))]">
              <MessageCircle className="h-3 w-3" />
              Confidence {Math.round(confidence * 100)}%
            </div>
          ) : null}
        </motion.div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleEscalate()}
            disabled={sending || loading}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Full Change Order
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing((v) => !v)}
            disabled={sending || loading}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {editing ? "Preview" : "Edit"}
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSend()}
            disabled={sending || loading || !activeText.trim()}
            className="bg-[#1D9E75] text-xs hover:bg-[#178862]"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {sending ? "Sending…" : "Send as is"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
