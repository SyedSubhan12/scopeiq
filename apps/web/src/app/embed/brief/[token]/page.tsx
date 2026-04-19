"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { z } from "zod";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type FieldType = "text" | "textarea" | "select" | "multiselect" | "email" | "url";

interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
}

interface FormConfig {
  title?: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
}

const submitSchema = z.object({
  clientName: z.string().min(1, "Name is required").max(255),
  clientEmail: z.string().email("Valid email required").max(320),
  projectName: z.string().min(1, "Project name is required").max(255),
  responses: z.record(z.string()),
});

type SubmitData = z.infer<typeof submitSchema>;

type PageState = "loading" | "form" | "submitting" | "success" | "error";

export default function EmbedBriefPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Controlled form values
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectName, setProjectName] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setErrorMessage("Invalid embed link.");
      setPageState("error");
      return;
    }

    fetch(`${API_BASE}/public/brief-embed/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Form not found or inactive.");
        const json = (await res.json()) as { data: { formConfig: FormConfig } };
        setFormConfig(json.data.formConfig);
        setPageState("form");
      })
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load form.");
        setPageState("error");
      });
  }, [token]);

  function setResponse(key: string, value: string) {
    setResponses((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const parsed = submitSchema.safeParse({
      clientName,
      clientEmail,
      projectName,
      responses,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") errs[path] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setPageState("submitting");

    try {
      const res = await fetch(
        `${API_BASE}/public/brief-embed/${encodeURIComponent(token)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data satisfies SubmitData),
        },
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Submission failed. Please try again.");
      }

      setPageState("success");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Submission failed.");
      setPageState("error");
    }
  }

  if (pageState === "loading") {
    return (
      <div className="embed-container">
        <p className="embed-loading">Loading form…</p>
        <style>{embedStyles}</style>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="embed-container">
        <p className="embed-error">{errorMessage}</p>
        <style>{embedStyles}</style>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="embed-container">
        <div className="embed-success">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
            <circle cx="24" cy="24" r="22" stroke="#10b981" strokeWidth="2.5" fill="none" />
            <path d="M14 24 L21 31 L34 17" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <h2>Thank you!</h2>
          <p>Your brief has been submitted. We&apos;ll be in touch soon.</p>
        </div>
        <style>{embedStyles}</style>
      </div>
    );
  }

  const config = formConfig!;

  return (
    <div className="embed-container">
      {config.title && <h1 className="embed-title">{config.title}</h1>}
      {config.description && <p className="embed-description">{config.description}</p>}

      <form onSubmit={(e) => { void handleSubmit(e); }} noValidate>
        {/* Contact fields */}
        <div className="embed-field">
          <label htmlFor="clientName" className="embed-label">
            Your name <span aria-hidden>*</span>
          </label>
          <input
            id="clientName"
            type="text"
            className="embed-input"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            maxLength={255}
          />
          {fieldErrors["clientName"] && (
            <p className="embed-field-error">{fieldErrors["clientName"]}</p>
          )}
        </div>

        <div className="embed-field">
          <label htmlFor="clientEmail" className="embed-label">
            Email address <span aria-hidden>*</span>
          </label>
          <input
            id="clientEmail"
            type="email"
            className="embed-input"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            required
            maxLength={320}
          />
          {fieldErrors["clientEmail"] && (
            <p className="embed-field-error">{fieldErrors["clientEmail"]}</p>
          )}
        </div>

        <div className="embed-field">
          <label htmlFor="projectName" className="embed-label">
            Project name <span aria-hidden>*</span>
          </label>
          <input
            id="projectName"
            type="text"
            className="embed-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            maxLength={255}
          />
          {fieldErrors["projectName"] && (
            <p className="embed-field-error">{fieldErrors["projectName"]}</p>
          )}
        </div>

        {/* Dynamic form fields */}
        {config.fields.map((field) => (
          <div key={field.key} className="embed-field">
            <label htmlFor={`field-${field.key}`} className="embed-label">
              {field.label}
              {field.required && <span aria-hidden> *</span>}
            </label>
            {field.helpText && <p className="embed-help">{field.helpText}</p>}

            {field.type === "textarea" ? (
              <textarea
                id={`field-${field.key}`}
                className="embed-textarea"
                placeholder={field.placeholder}
                value={responses[field.key] ?? ""}
                onChange={(e) => setResponse(field.key, e.target.value)}
                required={field.required}
                rows={4}
                maxLength={5000}
              />
            ) : field.type === "select" || field.type === "multiselect" ? (
              <select
                id={`field-${field.key}`}
                className="embed-select"
                value={responses[field.key] ?? ""}
                onChange={(e) => setResponse(field.key, e.target.value)}
                required={field.required}
                multiple={field.type === "multiselect"}
              >
                <option value="">Select…</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`field-${field.key}`}
                type={field.type}
                className="embed-input"
                placeholder={field.placeholder}
                value={responses[field.key] ?? ""}
                onChange={(e) => setResponse(field.key, e.target.value)}
                required={field.required}
                maxLength={field.type === "email" ? 320 : 2000}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          className="embed-submit"
          disabled={pageState === "submitting"}
        >
          {pageState === "submitting" ? "Submitting…" : (config.submitLabel ?? "Submit Brief")}
        </button>
      </form>

      <style>{embedStyles}</style>
    </div>
  );
}

const embedStyles = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: transparent; }
  .embed-container { max-width: 640px; margin: 0 auto; padding: 24px 16px; }
  .embed-title { font-size: 1.375rem; font-weight: 700; margin: 0 0 8px; color: #111; }
  .embed-description { font-size: 0.9rem; color: #555; margin: 0 0 24px; line-height: 1.5; }
  .embed-field { margin-bottom: 18px; }
  .embed-label { display: block; font-size: 0.875rem; font-weight: 600; color: #222; margin-bottom: 6px; }
  .embed-help { font-size: 0.8rem; color: #666; margin: 0 0 6px; }
  .embed-input, .embed-textarea, .embed-select {
    width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px;
    font-size: 0.9rem; color: #111; background: #fff; outline: none;
    transition: border-color 0.15s;
  }
  .embed-input:focus, .embed-textarea:focus, .embed-select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .embed-textarea { resize: vertical; min-height: 96px; }
  .embed-field-error { font-size: 0.8rem; color: #dc2626; margin: 4px 0 0; }
  .embed-submit {
    margin-top: 8px; padding: 11px 28px; background: #6366f1; color: #fff;
    border: none; border-radius: 6px; font-size: 0.95rem; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
  }
  .embed-submit:hover:not(:disabled) { background: #4f46e5; }
  .embed-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .embed-loading, .embed-error { text-align: center; color: #666; padding: 48px 0; font-size: 0.95rem; }
  .embed-error { color: #dc2626; }
  .embed-success { text-align: center; padding: 48px 0; }
  .embed-success h2 { font-size: 1.25rem; font-weight: 700; color: #111; margin: 16px 0 8px; }
  .embed-success p { color: #555; font-size: 0.9rem; }
`;
