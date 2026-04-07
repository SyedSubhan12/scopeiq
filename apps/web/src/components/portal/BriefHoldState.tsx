"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, HelpCircle, Loader2 } from "lucide-react";
import { Button, Card, Input, Textarea, useToast } from "@novabots/ui";

export type ClarificationFlag = {
  fieldKey: string;
  fieldLabel: string;
  prompt: string;
  reason: string;
};

interface BriefHoldStateProps {
  flags: ClarificationFlag[];
  previousAnswers: Record<string, unknown>;
  onResubmit(values: Record<string, string>): void;
  brandColor?: string;
}

function prefersLongText(fieldKey: string, prompt: string): boolean {
  return (
    fieldKey.includes("scope") ||
    fieldKey.includes("description") ||
    fieldKey.includes("detail") ||
    prompt.length > 110
  );
}

export function BriefHoldState({
  flags,
  previousAnswers,
  onResubmit,
  brandColor,
}: BriefHoldStateProps) {
  const reduceMotion = useReducedMotion();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      flags.map((flag) => [
        flag.fieldKey,
        typeof previousAnswers[flag.fieldKey] === "string"
          ? (previousAnswers[flag.fieldKey] as string)
          : "",
      ]),
    ),
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const missingFlag = flags.find(
      (flag) => !(answers[flag.fieldKey] ?? "").trim(),
    );

    if (missingFlag) {
      toast("error", `Please answer "${missingFlag.fieldLabel}" before submitting.`);
      return;
    }

    setSubmitting(true);

    try {
      onResubmit(answers);
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Failed to resubmit brief.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = flags.filter(
    (flag) => (answers[flag.fieldKey] ?? "").trim().length > 0,
  ).length;

  const progressPercent = flags.length === 0 ? 100 : Math.round((answeredCount / flags.length) * 100);

  return (
    <div className="space-y-6" data-testid="brief-hold-state">
      {/* Header Card */}
      <Card className="overflow-hidden border-0 bg-white/80 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div
          className="border-b border-white/60 px-6 py-6 sm:px-8 sm:py-8"
          style={{
            background: brandColor
              ? `linear-gradient(135deg, ${brandColor}18 0%, rgba(255,255,255,0.96) 48%, rgba(255,255,255,0.92) 100%)`
              : undefined,
          }}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--text-muted))]">
                Needs Clarification
              </p>
              <h2 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">
                A few more details will help us get started
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-[rgb(var(--text-secondary))]">
                Please answer the following questions so we can begin work. Each item is
                focused on a specific area that needs your input.
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
              <span>Progress</span>
              <span>{progressPercent}% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(progressPercent, 8)}%`,
                  background: brandColor
                    ? `linear-gradient(90deg, ${brandColor} 0%, rgba(16,185,129,0.9) 100%)`
                    : "linear-gradient(90deg, rgb(var(--color-primary)) 0%, rgba(16,185,129,0.9) 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Clarification Items */}
      <div className="space-y-4">
        {flags.map((flag, index) => {
          const currentValue = answers[flag.fieldKey] ?? "";
          const previousValue =
            typeof previousAnswers[flag.fieldKey] === "string"
              ? (previousAnswers[flag.fieldKey] as string)
              : null;
          const isLongText = prefersLongText(flag.fieldKey, flag.prompt);
          const isAnswered = currentValue.trim().length > 0;

          return (
            <motion.div
              key={flag.fieldKey}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card
                data-testid={`clarification-item-${flag.fieldKey}`}
                className="border border-[rgb(var(--border-subtle))] p-6"
              >
                {/* Question Header */}
                <div className="mb-4 flex items-start gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: brandColor ?? "rgb(var(--color-primary))" }}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                      <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                        {flag.fieldLabel}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">
                      {flag.prompt}
                    </p>
                  </div>
                  {isAnswered && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  )}
                </div>

                {/* Previous Answer */}
                {previousValue ? (
                  <div className="mb-4 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                      Previous answer
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[rgb(var(--text-secondary))]">
                      {previousValue}
                    </p>
                  </div>
                ) : null}

                {/* Input */}
                {isLongText ? (
                  <Textarea
                    value={currentValue}
                    onChange={(event) =>
                      setAnswers((prev) => ({ ...prev, [flag.fieldKey]: event.target.value }))
                    }
                    placeholder="Provide the extra detail requested here..."
                    rows={5}
                    className="w-full"
                  />
                ) : (
                  <Input
                    value={currentValue}
                    onChange={(event) =>
                      setAnswers((prev) => ({ ...prev, [flag.fieldKey]: event.target.value }))
                    }
                    placeholder="Your updated answer..."
                    className="w-full"
                  />
                )}

                {/* Helper text showing reason */}
                <p className="mt-2 text-xs text-[rgb(var(--text-muted))]">
                  Why: {flag.reason}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 rounded-2xl border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))]/50 px-6 py-4">
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {answeredCount} of {flags.length} answered
        </p>
        <Button
          onClick={() => void handleSubmit()}
          disabled={submitting || answeredCount < flags.length}
          className="rounded-xl px-5"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Resubmit Brief
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
