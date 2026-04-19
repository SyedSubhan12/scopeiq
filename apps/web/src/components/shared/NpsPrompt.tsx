"use client";

/**
 * Sprint 6 — NPS prompt (FEAT-NEW-012).
 *
 * Shows a dismissible Net Promoter Score prompt in the bottom-right corner
 * after the user has spent ~5 minutes in the dashboard for the first time.
 * Persists the "submitted" / "dismissed" state in localStorage so we never
 * nag the same user twice.
 *
 * The widget POSTs to /v1/feedback/nps which writes into the audit_log
 * table with entityType='nps_feedback' — no new schema required.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button, useToast, cn } from "@novabots/ui";
import { fetchWithAuth } from "@/lib/api";

const STORAGE_KEY = "scopeiq.nps.v1";
const DELAY_MS = 5 * 60 * 1000; // 5 minutes

type PromptState = "hidden" | "rating" | "comment";

interface StoredNps {
  submitted?: boolean;
  dismissedAt?: number;
  score?: number;
}

function readStored(): StoredNps {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredNps) : {};
  } catch {
    return {};
  }
}

function writeStored(value: StoredNps) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export function NpsPrompt() {
  const [state, setState] = useState<PromptState>("hidden");
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const stored = readStored();
    // Already submitted or dismissed within the last 14 days — stay hidden.
    if (stored.submitted) return;
    if (
      stored.dismissedAt &&
      Date.now() - stored.dismissedAt < 14 * 24 * 60 * 60 * 1000
    ) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      setState("rating");
    }, DELAY_MS);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const close = useCallback(
    (remember: "dismiss" | "submit") => {
      setState("hidden");
      if (remember === "submit") {
        writeStored({
          submitted: true,
          ...(score !== null ? { score } : {}),
        });
      } else {
        writeStored({ dismissedAt: Date.now() });
      }
    },
    [score],
  );

  const handleScore = (value: number) => {
    setScore(value);
    setState("comment");
  };

  const handleSubmit = async () => {
    if (score === null) return;
    setSubmitting(true);
    try {
      await fetchWithAuth("/v1/feedback/nps", {
        method: "POST",
        body: JSON.stringify({
          score,
          comment: comment.trim() || undefined,
          surface: "dashboard",
        }),
      });
      toast("success", "Thanks for the feedback!");
      close("submit");
    } catch {
      toast("error", "Couldn't save your feedback — try again later");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {state !== "hidden" && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "fixed bottom-4 right-4 z-[60] w-[calc(100vw-2rem)] max-w-sm",
            "rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))]",
            "p-4 shadow-lg sm:bottom-6 sm:right-6",
          )}
          role="dialog"
          aria-label="Share feedback about ScopeIQ"
        >
          <button
            type="button"
            onClick={() => close("dismiss")}
            aria-label="Dismiss feedback prompt"
            className="absolute right-2 top-2 rounded p-1 text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#1D9E75]" />
            <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              Quick question
            </p>
          </div>

          {state === "rating" ? (
            <>
              <p className="mb-3 text-sm text-[rgb(var(--text-secondary))]">
                How likely are you to recommend ScopeIQ to a friend or
                colleague?
              </p>
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, i) => i).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleScore(v)}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-md border text-xs font-medium",
                      "border-[rgb(var(--border-subtle))] text-[rgb(var(--text-secondary))]",
                      "transition-colors hover:border-[#1D9E75] hover:bg-[#1D9E75]/10 hover:text-[#1D9E75]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D9E75]/40",
                    )}
                    aria-label={`Score ${v} out of 10`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-[rgb(var(--text-muted))]">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </>
          ) : (
            <>
              <p className="mb-2 text-sm text-[rgb(var(--text-secondary))]">
                You scored{" "}
                <span className="font-semibold text-[rgb(var(--text-primary))]">
                  {score}
                </span>
                . What&apos;s the main reason?
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Optional — one sentence is plenty"
                className="w-full resize-none rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-3 py-2 text-sm text-[rgb(var(--text-primary))] outline-none transition-colors focus:border-[#1D9E75]"
              />
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => close("dismiss")}
                  disabled={submitting}
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send"}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
