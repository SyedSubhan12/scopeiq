import type { BriefTemplateField } from "@/lib/briefs";

export type BriefField = BriefTemplateField;

export function normalizeFieldOrder(fields: BriefField[]): BriefField[] {
  return fields.map((field, index) => ({ ...field, order: index }));
}

function generateKey(type: BriefField["type"]): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

const DEFAULT_FIELD_LABELS: Record<BriefField["type"], string> = {
  text: "Short Text",
  textarea: "Long Text",
  single_choice: "Single Choice",
  multi_choice: "Multi Choice",
  date: "Date",
  file_upload: "File Upload",
};

export function createField(type: BriefField["type"], order: number): BriefField {
  return {
    key: generateKey(type),
    type,
    label: DEFAULT_FIELD_LABELS[type],
    required: false,
    options:
      type === "single_choice" || type === "multi_choice"
        ? ["Option 1"]
        : undefined,
    conditions: [],
    order,
  };
}

export function insertField(fields: BriefField[], type: BriefField["type"], index?: number): BriefField[] {
  const nextFields = [...fields];
  const insertionIndex = typeof index === "number" ? Math.max(0, Math.min(index, nextFields.length)) : nextFields.length;
  nextFields.splice(insertionIndex, 0, createField(type, insertionIndex));
  return normalizeFieldOrder(nextFields);
}

export function moveField(fields: BriefField[], key: string, direction: "up" | "down"): BriefField[] {
  const currentIndex = fields.findIndex((field) => field.key === key);
  if (currentIndex < 0) return fields;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= fields.length) {
    return fields;
  }

  const nextFields = [...fields];
  const [field] = nextFields.splice(currentIndex, 1);
  if (!field) return fields;
  nextFields.splice(targetIndex, 0, field);
  return normalizeFieldOrder(nextFields);
}

export function updateField(fields: BriefField[], updatedField: BriefField): BriefField[] {
  return normalizeFieldOrder(
    fields.map((field) => (field.key === updatedField.key ? updatedField : field)),
  );
}

export function removeField(fields: BriefField[], key: string): BriefField[] {
  return normalizeFieldOrder(fields.filter((field) => field.key !== key));
}
