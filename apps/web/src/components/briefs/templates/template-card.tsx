import Link from "next/link";
import { Calendar, FileText } from "lucide-react";
import { Card } from "@novabots/ui";
import { StatusBadge } from "@/components/briefs/shared/status-badge";
import { type BriefTemplateRecord } from "@/lib/briefs";

interface TemplateCardProps {
  template: BriefTemplateRecord;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Link href={`/briefs/templates/${template.id}`} className="block">
      <Card
        hoverable
        className="group flex h-full flex-col rounded-3xl border-[rgb(var(--border-subtle))] p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <StatusBadge status={template.status} kind="template" />
        </div>

        <div className="mt-5 space-y-2">
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-[rgb(var(--text-primary))]">
            {template.name}
          </h3>
          <p className="line-clamp-2 min-h-[2.75rem] text-sm leading-6 text-[rgb(var(--text-secondary))]">
            {template.description || "Use this brief to collect a cleaner project kickoff from clients."}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-4 pt-5 text-xs text-[rgb(var(--text-muted))]">
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {template.fields.length} fields
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(template.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </Card>
    </Link>
  );
}

