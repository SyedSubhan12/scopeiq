"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";
import { Card, Button } from "@novabots/ui";
import { FieldLibrary, FIELD_TYPES } from "./FieldLibrary";
import { FieldEditor } from "./FieldEditor";
import { FormPreview } from "./FormPreview";
import type { BriefField } from "@/hooks/useBriefTemplates";
import {
  insertField,
  removeField,
  updateField,
} from "./form-builder.utils";

interface FormBuilderProps {
  fields: BriefField[];
  templateName?: string;
  onChange: (fields: BriefField[]) => void;
}

interface SortableFieldCardProps {
  field: BriefField;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableFieldCard({
  field,
  index,
  total,
  isSelected,
  onSelect,
  onDelete,
}: SortableFieldCardProps) {
  const typeConfig = FIELD_TYPES.find((item) => item.type === field.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      layout
      style={style}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.18 }}
    >
      <Card
        data-testid="brief-field-card"
        className={`flex items-center gap-3 transition-all ${
          isDragging
            ? "border-[#1D9E75] ring-1 ring-[#1D9E75]/50 shadow-lg"
            : isSelected
            ? "border-primary ring-1 ring-primary"
            : "hover:border-primary/40"
        }`}
      >
        {/* Drag handle */}
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-xl bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-muted))] transition-colors hover:bg-[#1D9E75]/10 hover:text-[#1D9E75] active:cursor-grabbing"
          aria-label={`Drag to reorder ${field.label || "Untitled field"}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Field info */}
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Select field ${field.label || "Untitled field"}`}
          className="flex flex-1 items-center gap-3 text-left"
        >
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

        {/* Delete */}
        <div className="flex shrink-0 items-center">
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
    </motion.div>
  );
}

export function FormBuilder({ fields, templateName, onChange }: FormBuilderProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  const selectedField = sortedFields.find((field) => field.key === selectedKey) ?? null;
  const fieldIds = sortedFields.map((field) => field.key);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedFields.findIndex((field) => field.key === active.id);
    const newIndex = sortedFields.findIndex((field) => field.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedFields, oldIndex, newIndex).map((field, idx) => ({
      ...field,
      order: idx,
    }));
    onChange(reordered);
  }

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

  return (
    <div className="flex h-full gap-4">
      <FieldLibrary onAddField={handleAddField} />

      <div className="flex-1 overflow-y-auto">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3" data-testid="brief-field-stack">
              {sortedFields.length === 0 ? (
                <Card className="py-12 text-center" data-testid="brief-field-stack-empty">
                  <p className="text-sm text-[rgb(var(--text-muted))]">
                    Add fields from the library to build your brief flow.
                  </p>
                </Card>
              ) : (
                <AnimatePresence mode="popLayout">
                  {sortedFields.map((field, index) => (
                    <SortableFieldCard
                      key={field.key}
                      field={field}
                      index={index}
                      total={sortedFields.length}
                      isSelected={selectedKey === field.key}
                      onSelect={() => setSelectedKey(selectedKey === field.key ? null : field.key)}
                      onDelete={() => handleDelete(field.key)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </SortableContext>
        </DndContext>
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
