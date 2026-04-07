"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { ArrowRight, CheckCircle2, ChevronLeft, Clock3, FileUp, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button, Card, Input, Textarea, useToast } from "@novabots/ui";
import { cn } from "@novabots/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { usePortalSession } from "@/hooks/usePortalSession";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type BriefField = {
  id: string;
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  options?: string[];
  conditions?: {
    field_key: string;
    operator: "equals" | "not_equals" | "contains";
    value: string;
  }[];
  order: number;
  value: string | null;
  attachments: {
    id: string;
    originalName: string;
    fileUrl: string;
    mimeType: string | null;
    sizeBytes: number | null;
  }[];
};

interface IntakeFormProps {
  brief: {
    id: string;
    title: string;
    branding?: {
      accentColor?: string | null;
      introMessage?: string | null;
      successMessage?: string | null;
      supportEmail?: string | null;
    } | null;
    fields: BriefField[];
  };
  onSuccess: () => void;
  /** Called when the current step changes (step, total) */
  onStepChange?: (step: number, total: number) => void;
  /** Called when form values change */
  onValuesChange?: (values: Record<string, unknown>) => void;
}

type FormValues = Record<string, string | string[]>;
type BriefAttachment = BriefField["attachments"][number];

function normalizeFieldValue(field: BriefField): string | string[] {
  if (field.type === "multi_choice") {
    if (!field.value) return [];
    return field.value
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return field.value ?? "";
}

function shouldShowField(field: BriefField, values: FormValues): boolean {
  if (!field.conditions || field.conditions.length === 0) return true;

  return field.conditions.every((condition) => {
    const rawValue = values[condition.field_key];
    const normalizedValue = Array.isArray(rawValue) ? rawValue.join(",") : (rawValue ?? "");

    switch (condition.operator) {
      case "equals":
        return normalizedValue === condition.value;
      case "not_equals":
        return normalizedValue !== condition.value;
      case "contains":
        return normalizedValue.includes(condition.value);
      default:
        return true;
    }
  });
}

function renderAnswer(value: string | string[]) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "No answer yet";
  }

  return value.trim() || "No answer yet";
}

function isFieldAnswered(
  field: BriefField,
  value: string | string[] | undefined,
  attachments: BriefAttachment[] = [],
) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (field.type === "single_choice") {
    return typeof value === "string" && value.trim().length > 0;
  }

  if (field.type === "file_upload") {
    return attachments.length > 0;
  }

  return typeof value === "string" && value.trim().length > 0;
}

export function IntakeForm({ brief, onSuccess, onStepChange, onValuesChange }: IntakeFormProps) {
  const { token, workspace, project } = usePortalSession();
  const reduceMotion = useReducedMotion();
  const { toast } = useToast();
  const brandColor = brief.branding?.accentColor || workspace.brandColor;
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prediction, setPrediction] = useState<{ score: number; feedback: string; is_clear: boolean } | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [uploadingFieldKey, setUploadingFieldKey] = useState<string | null>(null);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const sortedFields = useMemo(
    () => [...brief.fields].sort((a, b) => a.order - b.order),
    [brief.fields],
  );

  const defaultValues = useMemo<FormValues>(
    () =>
      Object.fromEntries(
        sortedFields.map((field) => [field.key, normalizeFieldValue(field)]),
      ),
    [sortedFields],
  );
  const initialAttachments = useMemo<Record<string, BriefAttachment[]>>(
    () =>
      Object.fromEntries(
        sortedFields.map((field) => [field.key, field.attachments ?? []]),
      ),
    [sortedFields],
  );
  const [attachmentsByField, setAttachmentsByField] = useState<Record<string, BriefAttachment[]>>(initialAttachments);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues,
  });

  const values = useWatch({ control }) as FormValues;
  const debouncedDraftValues = useDebounce(values, 1200);
  const visibleFields = useMemo(
    () => sortedFields.filter((field) => shouldShowField(field, values ?? defaultValues)),
    [defaultValues, sortedFields, values],
  );

  const currentStepCount = visibleFields.length + 1;
  const currentField = visibleFields[step] ?? null;
  const isReviewStep = step >= visibleFields.length;
  const currentValue = currentField ? values?.[currentField.key] : undefined;
  const debouncedValue = useDebounce(currentValue, 700);
  const currentFieldAttachments = currentField ? (attachmentsByField[currentField.key] ?? []) : [];
  const lastSavedSignatureRef = useRef(JSON.stringify(defaultValues));

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(step, visibleFields.length);
  }, [step, visibleFields.length, onStepChange]);

  // Notify parent of value changes
  useEffect(() => {
    if (onValuesChange && values) {
      onValuesChange(values as Record<string, unknown>);
    }
  }, [values, onValuesChange]);

  useEffect(() => {
    setAttachmentsByField(initialAttachments);
  }, [initialAttachments]);

  useEffect(() => {
    lastSavedSignatureRef.current = JSON.stringify(defaultValues);
  }, [defaultValues]);

  const answeredCount = visibleFields.filter((field) => {
    const value = values?.[field.key];
    return isFieldAnswered(field, value, attachmentsByField[field.key] ?? []);
  }).length;

  const completionPercent = visibleFields.length === 0
    ? 100
    : Math.round((answeredCount / visibleFields.length) * 100);
  const currentFieldError =
    currentField && typeof errors[currentField.key]?.message === "string"
      ? String(errors[currentField.key]?.message)
      : null;
  const currentFieldArrayValue =
    currentField && Array.isArray(values?.[currentField.key])
      ? (values[currentField.key] as string[])
      : [];
  const currentFieldFileNames = currentFieldAttachments.map((attachment) => attachment.originalName);

  useEffect(() => {
    if (step > visibleFields.length) {
      setStep(visibleFields.length);
    }
  }, [step, visibleFields.length]);

  useEffect(() => {
    if (!debouncedDraftValues || submitted || submitting || !brief.id) {
      return;
    }

    const nextSignature = JSON.stringify(debouncedDraftValues);
    if (nextSignature === lastSavedSignatureRef.current) {
      return;
    }

    const controller = new AbortController();

    const saveDraft = async () => {
      setDraftStatus("saving");

      try {
        const response = await fetch(`${API_BASE_URL}/portal/session/brief/draft`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Portal-Token": token,
          },
          body: JSON.stringify({
            briefId: brief.id,
            responses: debouncedDraftValues,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message ?? "Failed to save draft");
        }

        lastSavedSignatureRef.current = nextSignature;
        setDraftStatus("saved");
        setLastSavedAt(new Date());
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setDraftStatus("error");
        }
      }
    };

    void saveDraft();

    return () => controller.abort();
  }, [API_BASE_URL, brief.id, debouncedDraftValues, submitted, submitting, token]);

  useEffect(() => {
    if (!currentField || (currentField.type !== "text" && currentField.type !== "textarea")) {
      setPrediction(null);
      return;
    }

    const value = Array.isArray(debouncedValue) ? debouncedValue.join(", ") : (debouncedValue ?? "");
    if (value.trim().length < 20) {
      setPrediction(null);
      return;
    }

    const controller = new AbortController();

    const checkClarity = async () => {
      setIsPredicting(true);

      try {
        const response = await fetch(`${API_BASE_URL}/v1/ai/predict-clarity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field_label: currentField.label,
            field_value: value,
          }),
          signal: controller.signal,
        });

        if (!response.ok) return;
        const data = await response.json();
        setPrediction(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setPrediction(null);
        }
      } finally {
        setIsPredicting(false);
      }
    };

    void checkClarity();

    return () => controller.abort();
  }, [API_BASE_URL, currentField, debouncedValue]);

  const goNext = async () => {
    if (!currentField) {
      setStep(visibleFields.length);
      return;
    }

    const needsRegisteredValidation =
      currentField.type === "text" || currentField.type === "textarea" || currentField.type === "date";

    if (needsRegisteredValidation) {
      const valid = await trigger(currentField.key);
      if (!valid) {
        toast("error", `Please complete "${currentField.label}" to continue.`);
        return;
      }
    } else if (
      currentField.required &&
      !isFieldAnswered(currentField, currentValue, attachmentsByField[currentField.key] ?? [])
    ) {
      toast("error", `Please complete "${currentField.label}" to continue.`);
      return;
    }

    setStep((current) => Math.min(current + 1, visibleFields.length));
  };

  const toggleMultiChoice = (fieldKey: string, option: string) => {
    const current = getValues(fieldKey);
    const valuesForField = Array.isArray(current) ? current : [];
    const nextValue = valuesForField.includes(option)
      ? valuesForField.filter((entry) => entry !== option)
      : [...valuesForField, option];

    setValue(fieldKey, nextValue, { shouldDirty: true, shouldValidate: true });
  };

  const uploadAttachment = async (field: BriefField, file: File) => {
    const uploadUrlResponse = await fetch(`${API_BASE_URL}/portal/session/brief/files/upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Portal-Token": token,
      },
      body: JSON.stringify({
        briefId: brief.id,
        fieldKey: field.key,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
      }),
    });

    if (!uploadUrlResponse.ok) {
      const payload = await uploadUrlResponse.json().catch(() => null);
      throw new Error(payload?.message ?? `Failed to prepare upload for ${file.name}`);
    }

    const { data: uploadData } = await uploadUrlResponse.json() as {
      data: { upload_url: string; object_key: string };
    };

    const putResponse = await fetch(uploadData.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!putResponse.ok) {
      throw new Error(`Upload failed for ${file.name}`);
    }

    const confirmResponse = await fetch(`${API_BASE_URL}/portal/session/brief/files/confirm-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Portal-Token": token,
      },
      body: JSON.stringify({
        briefId: brief.id,
        fieldKey: field.key,
        objectKey: uploadData.object_key,
        originalName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
      }),
    });

    if (!confirmResponse.ok) {
      const payload = await confirmResponse.json().catch(() => null);
      throw new Error(payload?.message ?? `Failed to confirm upload for ${file.name}`);
    }

    const { data: attachment } = await confirmResponse.json() as { data: BriefAttachment };

    setAttachmentsByField((current) => ({
      ...current,
      [field.key]: [...(current[field.key] ?? []), attachment],
    }));
  };

  const handleFileSelection = async (field: BriefField, fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    setUploadingFieldKey(field.key);
    try {
      for (const file of files) {
        await uploadAttachment(field, file);
      }
      toast("success", `${files.length} file${files.length > 1 ? "s" : ""} uploaded.`);
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "Failed to upload attachment.");
    } finally {
      setUploadingFieldKey(null);
    }
  };

  const removeAttachment = async (fieldKey: string, attachmentId: string) => {
    setRemovingAttachmentId(attachmentId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/portal/session/brief/files/${attachmentId}?briefId=${encodeURIComponent(brief.id)}`,
        {
          method: "DELETE",
          headers: {
            "X-Portal-Token": token,
          },
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Failed to remove attachment");
      }

      setAttachmentsByField((current) => ({
        ...current,
        [fieldKey]: (current[fieldKey] ?? []).filter((attachment) => attachment.id !== attachmentId),
      }));
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "Failed to remove attachment.");
    } finally {
      setRemovingAttachmentId(null);
    }
  };

  const onSubmit = async (formValues: FormValues) => {
    const missingRequiredField = visibleFields.find(
      (field) =>
        field.required &&
        !isFieldAnswered(field, formValues[field.key], attachmentsByField[field.key] ?? []),
    );

    if (missingRequiredField) {
      setStep(Math.max(visibleFields.findIndex((field) => field.key === missingRequiredField.key), 0));
      toast("error", `Please complete "${missingRequiredField.label}" before submitting.`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/portal/session/brief/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Portal-Token": token,
        },
        body: JSON.stringify({
          briefId: brief.id,
          responses: formValues,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Failed to submit brief");
      }

      setSubmitted(true);
      toast("success", "Brief submitted successfully.");
      window.setTimeout(onSuccess, 1800);
    } catch (error) {
      toast(
        "error",
        error instanceof Error ? error.message : "Failed to submit brief. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="mx-auto max-w-3xl overflow-hidden border-0 bg-white/90 p-0 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-8 text-white sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/75">Brief Received</p>
              <h2 className="text-2xl font-semibold">Kickoff details locked in</h2>
            </div>
          </div>
        </div>
        <div className="space-y-4 px-6 py-8 sm:px-8">
          <p className="text-sm leading-7 text-[rgb(var(--text-secondary))]">
            Your brief for <span className="font-semibold text-[rgb(var(--text-primary))]">{project.name}</span> has been submitted.
            The team can now review your answers, score clarity, and move the work forward.
          </p>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
            Next: the agency reviews your responses, flags any unclear areas, and confirms scope before delivery work starts.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" data-testid="brief-form">
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 bg-white/80 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div
            className="border-b border-white/60 px-6 py-6 sm:px-8"
            style={{
              background: `linear-gradient(135deg, ${brandColor}18 0%, rgba(255,255,255,0.96) 48%, rgba(255,255,255,0.92) 100%)`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--text-muted))]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Client Brief
                </div>
                <h2 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">{brief.title}</h2>
                <p className="max-w-2xl text-sm leading-6 text-[rgb(var(--text-secondary))]">
                  {brief.branding?.introMessage || "Share the details that shape the work. The form adapts as you answer, so you only see questions relevant to this project."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-[rgb(var(--text-secondary))]">
                  <Clock3 className="h-4 w-4" />
                  Estimated time
                </div>
                <div className="mt-1 text-lg font-semibold text-[rgb(var(--text-primary))]">
                  {Math.max(3, visibleFields.length * 2)} min
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                  {draftStatus === "saving" && "Saving draft"}
                  {draftStatus === "saved" && `Saved${lastSavedAt ? ` ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`}
                  {draftStatus === "error" && "Draft not saved"}
                  {draftStatus === "idle" && "Draft idle"}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
                <span>Progress</span>
                <span>{completionPercent}% complete</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${isReviewStep ? 100 : Math.max(completionPercent, 8)}%`,
                    background: `linear-gradient(90deg, ${brandColor} 0%, rgba(16,185,129,0.9) 100%)`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <AnimatePresence mode="wait">
              {isReviewStep ? (
                <motion.div
                  key="review-step"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? {} : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--text-muted))]">
                      Final Review
                    </p>
                    <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
                      Check the brief before sending it over
                    </h3>
                    <p className="text-sm leading-6 text-[rgb(var(--text-secondary))]">
                      Review each answer and jump back to any section that needs a correction.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {visibleFields.map((field, index) => (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() => setStep(index)}
                        className="flex w-full cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))]/70 p-4 text-left transition-colors hover:border-primary/30 hover:bg-white"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                            {field.label}
                          </p>
                          <p className="text-sm leading-6 text-[rgb(var(--text-secondary))]">
                            {field.type === "file_upload"
                              ? (attachmentsByField[field.key] ?? []).map((attachment) => attachment.originalName).join(", ") || "No files uploaded"
                              : renderAnswer(values?.[field.key] ?? "")}
                          </p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
                          Edit
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : currentField ? (
                <motion.div
                  key={currentField.key}
                  initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                  animate={reduceMotion ? {} : { opacity: 1, x: 0 }}
                  exit={reduceMotion ? {} : { opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--text-muted))]">
                      Step {Math.min(step + 1, currentStepCount)} of {currentStepCount}
                    </p>
                    <h3 className="text-2xl font-semibold leading-tight text-[rgb(var(--text-primary))]">
                      {currentField.label}
                      {currentField.required ? <span className="ml-2 text-status-red">*</span> : null}
                    </h3>
                    <p className="max-w-2xl text-sm leading-6 text-[rgb(var(--text-secondary))]">
                      {currentField.description ?? "Provide enough context that the team can act without chasing you for follow-up details."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {(currentField.type === "text" || currentField.type === "date") && (
                      <Input
                        type={currentField.type === "date" ? "date" : "text"}
                        placeholder={currentField.placeholder ?? "Enter your answer"}
                        {...register(currentField.key, {
                          required: currentField.required ? `${currentField.label} is required` : false,
                        })}
                        {...(currentFieldError ? { error: currentFieldError } : {})}
                        className="h-14 rounded-2xl border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))]/40 px-4 text-base"
                      />
                    )}

                    {currentField.type === "textarea" && (
                      <Textarea
                        placeholder={currentField.placeholder ?? "Share the full context here"}
                        rows={8}
                        {...register(currentField.key, {
                          required: currentField.required ? `${currentField.label} is required` : false,
                        })}
                        {...(currentFieldError ? { error: currentFieldError } : {})}
                        className="min-h-[220px] rounded-3xl border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))]/40 px-5 py-4 text-base leading-7"
                      />
                    )}

                    {currentField.type === "single_choice" && (
                      <div className="grid gap-3">
                        {(currentField.options ?? []).map((option) => {
                          const checked = values?.[currentField.key] === option;

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setValue(currentField.key, option, { shouldDirty: true, shouldValidate: true })}
                              className={cn(
                                "flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200",
                                checked
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-[rgb(var(--border-default))] bg-white hover:border-primary/30 hover:bg-[rgb(var(--surface-subtle))]/50",
                              )}
                            >
                              <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{option}</span>
                              <span
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-full border",
                                  checked
                                    ? "border-primary bg-primary"
                                    : "border-[rgb(var(--border-default))] bg-white",
                                )}
                              >
                                {checked ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                              </span>
                            </button>
                          );
                        })}
                        {errors[currentField.key] ? (
                          <p className="text-xs text-status-red">{String(errors[currentField.key]?.message ?? `${currentField.label} is required`)}</p>
                        ) : null}
                      </div>
                    )}

                    {currentField.type === "multi_choice" && (
                      <div className="grid gap-3">
                        {(currentField.options ?? []).map((option) => {
                          const selected = currentFieldArrayValue.includes(option);

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleMultiChoice(currentField.key, option)}
                              className={cn(
                                "flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200",
                                selected
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-[rgb(var(--border-default))] bg-white hover:border-primary/30 hover:bg-[rgb(var(--surface-subtle))]/50",
                              )}
                            >
                              <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{option}</span>
                              <span
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-md border",
                                  selected
                                    ? "border-primary bg-primary text-white"
                                    : "border-[rgb(var(--border-default))] bg-white",
                                )}
                              >
                                {selected ? "✓" : null}
                              </span>
                            </button>
                          );
                        })}
                        {errors[currentField.key] ? (
                          <p className="text-xs text-status-red">{String(errors[currentField.key]?.message ?? `${currentField.label} is required`)}</p>
                        ) : null}
                      </div>
                    )}

                    {currentField.type === "file_upload" && (
                      <div className="space-y-4 rounded-3xl border border-dashed border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))]/40 p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <FileUp className="h-5 w-5 text-[rgb(var(--text-secondary))]" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                              Select reference files
                            </p>
                            <p className="text-sm leading-6 text-[rgb(var(--text-secondary))]">
                              Upload briefs, references, screenshots, wireframes, or source docs directly into the project intake.
                            </p>
                          </div>
                        </div>

                        <input
                          type="file"
                          multiple
                          onChange={(event) => {
                            void handleFileSelection(currentField, event.target.files);
                            event.currentTarget.value = "";
                          }}
                          className="block w-full cursor-pointer rounded-2xl border border-[rgb(var(--border-default))] bg-white px-4 py-3 text-sm text-[rgb(var(--text-secondary))] file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                        />

                        {uploadingFieldKey === currentField.key ? (
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Uploading files
                          </div>
                        ) : null}

                        {currentFieldFileNames.length > 0 ? (
                          <div className="space-y-2">
                            {currentFieldAttachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--border-default))] bg-white px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-[rgb(var(--text-primary))]">
                                    {attachment.originalName}
                                  </p>
                                  <p className="text-xs text-[rgb(var(--text-muted))]">
                                    {attachment.sizeBytes ? `${Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB` : "Uploaded"}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => void removeAttachment(currentField.key, attachment.id)}
                                  disabled={removingAttachmentId === attachment.id}
                                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-[rgb(var(--border-default))] px-3 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] transition-colors hover:border-status-red hover:text-status-red disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {removingAttachmentId === attachment.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
                            No files uploaded yet
                          </p>
                        )}
                      </div>
                    )}

                    {prediction ? (
                      <div
                        className={cn(
                          "rounded-2xl border p-4 text-sm leading-6",
                          prediction.is_clear
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-amber-200 bg-amber-50 text-amber-900",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                              prediction.is_clear ? "bg-emerald-500" : "bg-amber-500",
                            )}
                          >
                            {prediction.score}
                          </div>
                          <div>
                            <p className="font-medium">
                              {prediction.is_clear ? "Clear enough to move forward" : "This answer could use a bit more detail"}
                            </p>
                            <p className="mt-1">{prediction.feedback}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {isPredicting ? (
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Checking clarity
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between border-t border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))]/50 px-6 py-4 sm:px-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              disabled={step === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            {isReviewStep ? (
              <Button type="submit" loading={submitting} className="rounded-xl px-5">
                Submit Brief
                {!submitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
              </Button>
            ) : (
              <Button type="button" onClick={() => void goNext()} className="rounded-xl px-5">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Card className="border-white/60 bg-white/75 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
            Brief Summary
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[rgb(var(--surface-subtle))]/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Answered</p>
              <p className="mt-2 text-2xl font-semibold text-[rgb(var(--text-primary))]">
                {answeredCount}
              </p>
            </div>
            <div className="rounded-2xl bg-[rgb(var(--surface-subtle))]/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">Questions</p>
              <p className="mt-2 text-2xl font-semibold text-[rgb(var(--text-primary))]">
                {visibleFields.length}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-[rgb(var(--border-default))] bg-white p-4">
            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">What happens next</p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">
              <li>We score the brief for clarity and completeness.</li>
              <li>The team reviews scope before starting delivery.</li>
              <li>If anything is unclear, you receive targeted clarification requests.</li>
            </ul>
          </div>
        </Card>

        <Card className="border-white/60 bg-white/75 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
            Step Map
          </p>
          <div className="mt-4 space-y-3">
            {visibleFields.map((field, index) => {
              const value = values?.[field.key];
              const done = Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
              const active = !isReviewStep && currentField?.key === field.key;

              return (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => setStep(index)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-[rgb(var(--border-default))] bg-white hover:border-primary/30",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-primary text-white"
                          : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))]",
                    )}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{field.label}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-[rgb(var(--text-muted))]">
                      {field.description ?? "Provide a precise answer so the team can execute without guesswork."}
                    </p>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setStep(visibleFields.length)}
              className={cn(
                "flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                isReviewStep
                  ? "border-primary bg-primary/5"
                  : "border-[rgb(var(--border-default))] bg-white hover:border-primary/30",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isReviewStep
                    ? "bg-primary text-white"
                    : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))]",
                )}
              >
                ✓
              </span>
              <div>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Review and submit</p>
                <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                  Confirm the full brief before delivery starts.
                </p>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </form>
  );
}
