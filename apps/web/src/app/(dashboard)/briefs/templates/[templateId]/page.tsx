"use client";

import { useParams } from "next/navigation";
import { TemplateDetailView } from "@/components/briefs/templates/template-detail-view";
import { useBriefTemplate } from "@/hooks/useBriefTemplates";

export default function BriefTemplateDetailPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const { data, isLoading } = useBriefTemplate(templateId);

  return (
    <TemplateDetailView
      templateId={templateId}
      template={data?.data}
      isLoading={isLoading}
    />
  );
}

