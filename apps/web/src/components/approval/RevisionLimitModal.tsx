"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, FileText, ArrowRight, X, Check } from "lucide-react";
import { Button, Skeleton } from "@novabots/ui";
import { useRevisionLimitModal } from "@/stores/revision-limit-modal.store";
import { fetchWithAuth } from "@/lib/api";

interface AddonQuote {
  price: number;
  label: string;
  description: string;
}

const DEFAULT_FALLBACK_QUOTE: AddonQuote = {
  price: 500,
  label: "Additional Revision Round",
  description: "Unlock additional revision round(s) for this deliverable.",
};

export function RevisionLimitModal() {
  const { isOpen, data, closeModal } = useRevisionLimitModal();
  const [acknowledged, setAcknowledged] = useState(false);
  const [liveQuote, setLiveQuote] = useState<AddonQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !data?.deliverableId) {
      setLiveQuote(null);
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);
    setLiveQuote(null);

    void (async () => {
      try {
        const result = await fetchWithAuth(
          `/v1/deliverables/${data.deliverableId}/addon-quote`,
        ) as AddonQuote;
        if (!cancelled) {
          setLiveQuote(result);
        }
      } catch {
        // Silent fallback — do not surface error UI
        if (!cancelled) {
          setLiveQuote(null);
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, data?.deliverableId]);

  if (!data) return null;

  const quote = liveQuote ?? data.addonQuote ?? {
    ...DEFAULT_FALLBACK_QUOTE,
    description: `Unlock ${Math.min(3, data.maxRevisions)} additional revision round(s) for this deliverable.`,
  };

  const handleRequestQuote = () => {
    closeModal();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[rgb(var(--border-default))] bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgb(var(--border-subtle))] bg-red-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-red-900">Revision Limit Reached</h2>
                  <p className="text-xs text-red-700">{data.deliverableName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 py-5">
              <p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                You have used all <strong className="text-[rgb(var(--text-primary))]">{data.maxRevisions}</strong>{" "}
                included revision round(s) for this deliverable. Additional rounds require a change order.
              </p>

              {/* Add-on quote card */}
              <div className="rounded-xl border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                    Pre-generated Quote
                  </span>
                </div>
                {quoteLoading ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <div className="space-y-1 text-right">
                      <Skeleton className="ml-auto h-6 w-20" />
                      <Skeleton className="ml-auto h-3 w-12" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{quote.label}</p>
                      <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">{quote.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[rgb(var(--text-primary))]">
                        ${quote.price.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-[rgb(var(--text-muted))]">estimated</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Acknowledgment checkbox */}
              <label className="flex cursor-pointer items-start gap-3">
                <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[rgb(var(--border-default)] bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded transition-all ${
                      acknowledged
                        ? "bg-primary text-white"
                        : "border-[rgb(var(--border-default))] bg-white"
                    }`}
                  >
                    {acknowledged && <Check className="h-3 w-3" />}
                  </div>
                </div>
                <span className="text-sm text-[rgb(var(--text-secondary))]">
                  I understand that additional revision rounds may incur additional charges as shown in the quote above.
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-6 py-4">
              <Button size="sm" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRequestQuote}
                disabled={!acknowledged}
                className="gap-1.5"
              >
                Request Additional Rounds
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
