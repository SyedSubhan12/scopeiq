"use client";

import {
  Type,
  AlignLeft,
  List,
  CheckSquare,
  Calendar,
  Upload,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BriefField } from "@/hooks/useBriefTemplates";

export type FieldType = BriefField["type"];

interface FieldTypeConfig {
  type: FieldType;
  label: string;
  description: string;
  Icon: LucideIcon;
}

export const FIELD_TYPES: FieldTypeConfig[] = [
  {
    type: "text",
    label: "Short Text",
    description: "Single-line text input",
    Icon: Type,
  },
  {
    type: "textarea",
    label: "Long Text",
    description: "Multi-line text area",
    Icon: AlignLeft,
  },
  {
    type: "single_choice",
    label: "Single Choice",
    description: "Pick one from a list",
    Icon: List,
  },
  {
    type: "multi_choice",
    label: "Multi Choice",
    description: "Pick multiple from a list",
    Icon: CheckSquare,
  },
  {
    type: "date",
    label: "Date",
    description: "Date picker",
    Icon: Calendar,
  },
  {
    type: "file_upload",
    label: "File Upload",
    description: "Attach a file",
    Icon: Upload,
  },
];

interface FieldLibraryProps {
  onAddField: (type: FieldType) => void;
}

export function FieldLibrary({ onAddField }: FieldLibraryProps) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col gap-2 overflow-y-auto">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
        Field Types
      </h3>
      <p className="text-xs text-[rgb(var(--text-muted))]">
        Add fields with one click. Reorder them from the stack to keep the flow stable on desktop and mobile.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {FIELD_TYPES.map((config) => {
          const { Icon } = config;

          return (
            <button
              key={config.type}
              type="button"
              onClick={() => onAddField(config.type)}
              data-testid={`brief-field-library-${config.type}`}
              className="flex items-center gap-2.5 rounded-lg border border-[rgb(var(--border-default))] bg-white p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{config.label}</p>
                <p className="truncate text-xs text-[rgb(var(--text-muted))]">{config.description}</p>
              </div>
              <Plus className="h-4 w-4 shrink-0 text-[rgb(var(--text-muted))]" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
