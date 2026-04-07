"use client";

import { useState, useCallback } from "react";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import { Card, Button } from "@novabots/ui";
import { FieldLibrary, FIELD_TYPES } from "./FieldLibrary";
import { FieldEditor } from "./FieldEditor";
import { FormPreview } from "./FormPreview";
import type { BriefField } from "@/hooks/useBriefTemplates";
import {
  insertField,
  moveField,
  removeField,
  updateField,
} from "./form-builder.utils";

interface FormBuilderProps {
  fields: BriefField[];
  templateName?: string;
  onChange: (fields: BriefField[]) => void;
}

interface FieldCardProps {
  field: BriefField;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
}

function FieldCard({
  field,
  index,
  total,
  isSelected,
  onSelect,
  onMove,
  onDelete,
}: FieldCardProps) {
  const typeConfig = FIELD_TYPES.find((item) => item.type === field.type);

  return (
    <Card
      data-testid="brief-field-card"
      className={`flex items-center gap-3 transition-all ${
        isSelected ? "border-primary ring-1 ring-primary" : "hover:border-primary/40"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Select field ${field.label || "Untitled field"}`}
        className="flex flex-1 items-center gap-3 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-muted))]">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
              {field.label || "Untitled field"}
            </span>
            <span className="rounded bg-[rgb(var(--surface-subtle))] px-1.5 py-0.5 text-xs text-[rgb(var(--text-muted))]">
              {typeConfig?.label ?? field.type}
            </span>
            {field.required ? (
              <span className="text-xs text-status-red">Required</span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            Step {index + 1} of {total}
          </p>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={index === 0}
          onClick={() => onMove("up")}
          aria-label={`Move field ${field.label || "Untitled field"} up`}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={index === total - 1}
          onClick={() => onMove("down")}
          aria-label={`Move field ${field.label || "Untitled field"} down`}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label={`Delete field ${field.label || "Untitled field"}`}
        >
          <Trash2 className="h-4 w-4 text-status-red" />
        </Button>
      </div>
    </Card>
  );
}

export function FormBuilder({ fields, templateName, onChange }: FormBuilderProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  const selectedField = sortedFields.find((field) => field.key === selectedKey) ?? null;

  const handleAddField = useCallback(
    (type: BriefField["type"]) => {
      const nextFields = insertField(sortedFields, type);
      const addedField = nextFields[nextFields.length - 1] ?? null;
      onChange(nextFields);
      if (addedField) {
        setSelectedKey(addedField.key);
      }
    },
    [onChange, sortedFields],
  );

  const handleFieldChange = useCallback(
    (updatedField: BriefField) => {
      onChange(updateField(sortedFields, updatedField));
    },
    [onChange, sortedFields],
  );

  const handleDelete = useCallback(
    (key: string) => {
      if (selectedKey === key) {
        setSelectedKey(null);
      }
      onChange(removeField(sortedFields, key));
    },
    [onChange, selectedKey, sortedFields],
  );

  const handleMove = useCallback(
    (key: string, direction: "up" | "down") => {
      onChange(moveField(sortedFields, key, direction));
    },
    [onChange, sortedFields],
  );

  return (
    <div className="flex h-full gap-4">
      <FieldLibrary onAddField={handleAddField} />

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3" data-testid="brief-field-stack">
          {sortedFields.length === 0 ? (
            <Card className="py-12 text-center" data-testid="brief-field-stack-empty">
              <p className="text-sm text-[rgb(var(--text-muted))]">
                Add fields from the library to build your brief flow.
              </p>
            </Card>
          ) : (
            sortedFields.map((field, index) => (
              <FieldCard
                key={field.key}
                field={field}
                index={index}
                total={sortedFields.length}
                isSelected={selectedKey === field.key}
                onSelect={() => setSelectedKey(selectedKey === field.key ? null : field.key)}
                onMove={(direction) => handleMove(field.key, direction)}
                onDelete={() => handleDelete(field.key)}
              />
            ))
          )}
        </div>
      </div>

      {selectedField ? (
        <FieldEditor
          field={selectedField}
          allFields={sortedFields}
          onChange={handleFieldChange}
          onClose={() => setSelectedKey(null)}
        />
      ) : (
        <FormPreview fields={sortedFields} {...(templateName ? { templateName } : {})} />
      )}
    </div>
  );
}
