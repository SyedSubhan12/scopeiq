"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Input, Textarea, Select, Button } from "@novabots/ui";
import type { BriefField } from "@/hooks/useBriefTemplates";

interface FieldEditorProps {
  field: BriefField;
  allFields: BriefField[];
  onChange: (updated: BriefField) => void;
  onClose: () => void;
}

const CONDITION_OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
] as const;

export function FieldEditor({ field, allFields, onChange, onClose }: FieldEditorProps) {
  const [optionInput, setOptionInput] = useState("");

  const update = (patch: Partial<BriefField>) => onChange({ ...field, ...patch });

  const addOption = () => {
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    update({ options: [...(field.options ?? []), trimmed] });
    setOptionInput("");
  };

  const removeOption = (index: number) => {
    const options = (field.options ?? []).filter((_, i) => i !== index);
    update({ options });
  };

  const addCondition = () => {
    const conditions = [
      ...(field.conditions ?? []),
      { field_key: "", operator: "equals" as const, value: "" },
    ];
    update({ conditions });
  };

  const removeCondition = (index: number) => {
    const conditions = (field.conditions ?? []).filter((_, i) => i !== index);
    update({ conditions });
  };

  const updateCondition = (
    index: number,
    patch: Partial<NonNullable<BriefField["conditions"]>[number]>,
  ) => {
    const conditions = (field.conditions ?? []).map((c, i) =>
      i === index ? { ...c, ...patch } : c,
    );
    update({ conditions });
  };

  const hasOptions = field.type === "single_choice" || field.type === "multi_choice";
  const otherFields = allFields.filter((f) => f.key !== field.key);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-l border-[rgb(var(--border-default))] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Edit Field</h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Label */}
        <Input
          label="Label"
          value={field.label}
          onChange={(e) => update({ label: e.target.value })}
          placeholder="Field label"
        />

        {/* Placeholder */}
        {(field.type === "text" || field.type === "textarea") && (
          <Input
            label="Placeholder"
            value={field.placeholder ?? ""}
            onChange={(e) => update({ placeholder: e.target.value })}
            placeholder="Hint text for respondents"
          />
        )}

        {/* Required toggle */}
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => update({ required: e.target.checked })}
              className="sr-only"
            />
            <div
              className={`h-5 w-9 rounded-full transition-colors ${
                field.required ? "bg-primary" : "bg-gray-200"
              }`}
            />
            <div
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                field.required ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">Required</span>
        </label>

        {/* Options (for choice types) */}
        {hasOptions && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[rgb(var(--text-primary))]">
              Options
            </label>
            {(field.options ?? []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 rounded-md border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] px-3 py-1.5 text-sm">
                  {opt}
                </span>
                <button
                  onClick={() => removeOption(i)}
                  className="rounded-md p-1 text-[rgb(var(--text-muted))] hover:text-status-red"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOption()}
                placeholder="Add option..."
                className="flex-1 rounded-lg border border-[rgb(var(--border-default))] px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Button size="sm" onClick={addOption} variant="secondary">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Conditions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[rgb(var(--text-primary))]">
              Show if
            </label>
            <button
              onClick={addCondition}
              disabled={otherFields.length === 0}
              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
              Add condition
            </button>
          </div>
          {(field.conditions ?? []).map((cond, i) => (
            <div
              key={i}
              className="flex flex-col gap-1.5 rounded-md border border-[rgb(var(--border-default))] p-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[rgb(var(--text-muted))]">Condition {i + 1}</span>
                <button
                  onClick={() => removeCondition(i)}
                  className="text-[rgb(var(--text-muted))] hover:text-status-red"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Select
                options={otherFields.map((f) => ({ value: f.key, label: f.label || f.key }))}
                value={cond.field_key}
                onChange={(v) => updateCondition(i, { field_key: v })}
                placeholder="Select field..."
              />
              <Select
                options={CONDITION_OPERATORS.map((o) => ({ value: o.value, label: o.label }))}
                value={cond.operator}
                onChange={(v) =>
                  updateCondition(i, {
                    operator: v as "equals" | "not_equals" | "contains",
                  })
                }
              />
              <input
                value={cond.value}
                onChange={(e) => updateCondition(i, { value: e.target.value })}
                placeholder="Value..."
                className="w-full rounded-lg border border-[rgb(var(--border-default))] px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ))}
          {(field.conditions ?? []).length === 0 && (
            <p className="text-xs text-[rgb(var(--text-muted))]">
              Always visible (no conditions)
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
