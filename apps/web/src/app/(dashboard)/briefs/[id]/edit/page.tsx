"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { Button, Skeleton, Input, useToast } from "@novabots/ui";
import { FormBuilder } from "@/components/brief/FormBuilder";
import {
  useBriefTemplate,
  useUpdateBriefTemplate,
  type BriefField,
} from "@/hooks/useBriefTemplates";

export default function EditBriefTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const { data, isLoading } = useBriefTemplate(id);
  const updateTemplate = useUpdateBriefTemplate(id);

  const [name, setName] = useState("");
  const [fields, setFields] = useState<BriefField[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Debounced auto-save
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (data?.data && !initialized) {
      setName(data.data.name ?? "");
      setFields(data.data.fields ?? []);
      setInitialized(true);
    }
  }, [data, initialized]);

  const autoSave = useCallback(
    (updatedFields: BriefField[], updatedName?: string) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          await updateTemplate.mutateAsync({
            name: updatedName ?? name,
            fields: updatedFields,
          });
        } catch {
          // Silent auto-save failure
        }
      }, 500);
    },
    [name, updateTemplate],
  );

  const handleFieldsChange = useCallback(
    (updated: BriefField[]) => {
      setFields(updated);
      autoSave(updated);
    },
    [autoSave],
  );

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName);
      autoSave(fields, newName);
    },
    [fields, autoSave],
  );

  const handleManualSave = async () => {
    try {
      await updateTemplate.mutateAsync({ name, fields });
      toast("success", "Template saved");
    } catch {
      toast("error", "Failed to save template");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/briefs")}
            className="rounded-md p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="border-none bg-transparent text-xl font-bold text-[rgb(var(--text-primary))] outline-none focus:ring-0"
            placeholder="Template name..."
          />
        </div>
        <div className="flex items-center gap-2">
          {updateTemplate.isPending && (
            <span className="text-xs text-[rgb(var(--text-muted))]">Saving...</span>
          )}
          <Button size="sm" onClick={() => void handleManualSave()}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      {/* Form Builder */}
      <div className="flex-1 overflow-hidden rounded-xl border border-[rgb(var(--border-default))] bg-white p-4">
        <FormBuilder
          fields={fields}
          templateName={name}
          onChange={handleFieldsChange}
        />
      </div>
    </div>
  );
}
