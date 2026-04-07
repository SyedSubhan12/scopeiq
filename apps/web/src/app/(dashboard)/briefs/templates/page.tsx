"use client";

import { TemplateLibraryView } from "@/components/briefs/templates/template-library-view";
import { useBriefTemplates } from "@/hooks/useBriefTemplates";

export default function BriefTemplatesPage() {
  const { data, isLoading } = useBriefTemplates();

  return <TemplateLibraryView templates={data?.data ?? []} isLoading={isLoading} />;
}

