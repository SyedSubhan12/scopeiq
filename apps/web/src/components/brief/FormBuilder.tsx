"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Card, Button } from "@novabots/ui";
import { FieldLibrary, FIELD_TYPES } from "./FieldLibrary";
import { FieldEditor } from "./FieldEditor";
import { FormPreview } from "./FormPreview";
import type { BriefField } from "@/hooks/useBriefTemplates";

interface FormBuilderProps {
  fields: BriefField[];
  templateName?: string;
  onChange: (fields: BriefField[]) => void;
}

function generateKey(type: string): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function createField(type: BriefField["type"], order: number): BriefField {
  const config = FIELD_TYPES.find((f) => f.type === type);
  return {
    key: generateKey(type),
    type,
    label: config?.label ?? type,
    required: false,
    ...(type === "single_choice" || type === "multi_choice" ? { options: ["Option 1"] } : {}),
    conditions: [],
    order,
  };
}

interface SortableFieldCardProps {
  field: BriefField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableFieldCard({ field, isSelected, onSelect, onDelete }: SortableFieldCardProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const typeConfig = FIELD_TYPES.find((f) => f.type === field.type);

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`flex cursor-pointer items-center gap-2 transition-all ${
          isSelected
            ? "border-primary ring-1 ring-primary"
            : "hover:border-primary/40"
        }`}
        onClick={onSelect}
      >
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab rounded p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))] active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
              {field.label || "Untitled field"}
            </span>
            <span className="rounded bg-[rgb(var(--surface-subtle))] px-1.5 py-0.5 text-xs text-[rgb(var(--text-muted))]">
              {typeConfig?.label ?? field.type}
            </span>
            {field.required && (
              <span className="text-xs text-status-red">Required</span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 rounded p-1 text-[rgb(var(--text-muted))] hover:text-status-red"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </Card>
    </div>
  );
}

export function FormBuilder({ fields, templateName, onChange }: FormBuilderProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const selectedField = fields.find((f) => f.key === selectedKey) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    // Dragging from library → add new field
    if (activeData?.source === "library") {
      const newField = createField(activeData.type as BriefField["type"], fields.length);
      const overIndex = fields.findIndex((f) => f.key === over.id);
      const updated = [...fields];
      if (overIndex >= 0) {
        updated.splice(overIndex + 1, 0, newField);
      } else {
        updated.push(newField);
      }
      onChange(updated.map((f, i) => ({ ...f, order: i })));
      setSelectedKey(newField.key);
      return;
    }

    // Reordering within canvas
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.key === active.id);
      const newIndex = fields.findIndex((f) => f.key === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        const reordered = arrayMove(fields, oldIndex, newIndex);
        onChange(reordered.map((f, i) => ({ ...f, order: i })));
      }
    }
  };

  const handleFieldChange = useCallback(
    (updated: BriefField) => {
      onChange(fields.map((f) => (f.key === updated.key ? updated : f)));
    },
    [fields, onChange],
  );

  const handleDelete = useCallback(
    (key: string) => {
      if (selectedKey === key) setSelectedKey(null);
      onChange(
        fields
          .filter((f) => f.key !== key)
          .map((f, i) => ({ ...f, order: i })),
      );
    },
    [fields, onChange, selectedKey],
  );

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4">
        {/* Left: Field Library */}
        <FieldLibrary />

        {/* Center: Canvas */}
        <div className="flex-1 overflow-y-auto">
          <SortableContext
            items={sortedFields.map((f) => f.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedFields.length === 0 ? (
                <Card className="py-12 text-center">
                  <p className="text-sm text-[rgb(var(--text-muted))]">
                    Drag fields from the library to build your form
                  </p>
                </Card>
              ) : (
                sortedFields.map((field) => (
                  <SortableFieldCard
                    key={field.key}
                    field={field}
                    isSelected={selectedKey === field.key}
                    onSelect={() =>
                      setSelectedKey(selectedKey === field.key ? null : field.key)
                    }
                    onDelete={() => handleDelete(field.key)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>

        {/* Right: Editor or Preview */}
        {selectedField ? (
          <FieldEditor
            field={selectedField}
            allFields={fields}
            onChange={handleFieldChange}
            onClose={() => setSelectedKey(null)}
          />
        ) : (
          <FormPreview fields={fields} {...(templateName ? { templateName } : {})} />
        )}
      </div>
    </DndContext>
  );
}
