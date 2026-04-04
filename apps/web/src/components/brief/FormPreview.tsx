"use client";

import { useState } from "react";
import { Eye, Calendar, Upload } from "lucide-react";
import type { BriefField } from "@/hooks/useBriefTemplates";

interface FormPreviewProps {
  fields: BriefField[];
  templateName?: string;
}

function shouldShowField(
  field: BriefField,
  values: Record<string, string | string[]>,
): boolean {
  if (!field.conditions || field.conditions.length === 0) return true;
  return field.conditions.every((cond) => {
    const val = values[cond.field_key];
    const strVal = Array.isArray(val) ? val.join(",") : (val ?? "");
    switch (cond.operator) {
      case "equals":
        return strVal === cond.value;
      case "not_equals":
        return strVal !== cond.value;
      case "contains":
        return strVal.includes(cond.value);
      default:
        return true;
    }
  });
}

export function FormPreview({ fields, templateName = "Brief Form" }: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, string | string[]>>({});

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  const visibleFields = sortedFields.filter((f) => shouldShowField(f, values));

  const setValue = (key: string, value: string | string[]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMulti = (key: string, option: string) => {
    const current = (values[key] as string[] | undefined) ?? [];
    const updated = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    setValue(key, updated);
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-l border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Eye className="h-4 w-4 text-[rgb(var(--text-muted))]" />
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Preview</h3>
      </div>

      <div className="rounded-xl border border-[rgb(var(--border-default))] bg-white p-4 shadow-sm">
        <h4 className="mb-4 text-base font-semibold text-[rgb(var(--text-primary))]">
          {templateName}
        </h4>

        {visibleFields.length === 0 ? (
          <p className="py-6 text-center text-sm text-[rgb(var(--text-muted))]">
            Add fields to see a preview
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleFields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="block text-sm font-medium text-[rgb(var(--text-primary))]">
                  {field.label || <span className="italic text-[rgb(var(--text-muted))]">Untitled field</span>}
                  {field.required && (
                    <span className="ml-1 text-status-red">*</span>
                  )}
                </label>

                {field.type === "text" && (
                  <input
                    type="text"
                    placeholder={field.placeholder ?? ""}
                    value={(values[field.key] as string) ?? ""}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    className="w-full rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                )}

                {field.type === "textarea" && (
                  <textarea
                    placeholder={field.placeholder ?? ""}
                    value={(values[field.key] as string) ?? ""}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                )}

                {field.type === "single_choice" && (
                  <div className="flex flex-col gap-1.5">
                    {(field.options ?? []).map((opt) => (
                      <label key={opt} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name={field.key}
                          value={opt}
                          checked={(values[field.key] as string) === opt}
                          onChange={() => setValue(field.key, opt)}
                          className="accent-primary"
                        />
                        <span className="text-sm text-[rgb(var(--text-primary))]">{opt}</span>
                      </label>
                    ))}
                    {(field.options ?? []).length === 0 && (
                      <p className="text-xs italic text-[rgb(var(--text-muted))]">No options yet</p>
                    )}
                  </div>
                )}

                {field.type === "multi_choice" && (
                  <div className="flex flex-col gap-1.5">
                    {(field.options ?? []).map((opt) => (
                      <label key={opt} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          value={opt}
                          checked={((values[field.key] as string[]) ?? []).includes(opt)}
                          onChange={() => toggleMulti(field.key, opt)}
                          className="accent-primary"
                        />
                        <span className="text-sm text-[rgb(var(--text-primary))]">{opt}</span>
                      </label>
                    ))}
                    {(field.options ?? []).length === 0 && (
                      <p className="text-xs italic text-[rgb(var(--text-muted))]">No options yet</p>
                    )}
                  </div>
                )}

                {field.type === "date" && (
                  <div className="relative">
                    <input
                      type="date"
                      value={(values[field.key] as string) ?? ""}
                      onChange={(e) => setValue(field.key, e.target.value)}
                      className="w-full rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}

                {field.type === "file_upload" && (
                  <div className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[rgb(var(--border-default))] p-4 text-center hover:border-primary/40">
                    <Upload className="h-5 w-5 text-[rgb(var(--text-muted))]" />
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                      Click to upload a file
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
