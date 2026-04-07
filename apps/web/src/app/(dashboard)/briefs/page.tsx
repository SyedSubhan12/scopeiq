"use client";

import { BriefsOverview } from "@/components/briefs/overview/briefs-overview";
import { useAllBriefs } from "@/hooks/useBriefs";
import { useBriefTemplates } from "@/hooks/useBriefTemplates";

export default function BriefsPage() {
  const { data: templateData, isLoading: templatesLoading } = useBriefTemplates();
  const { data: briefData, isLoading: briefsLoading } = useAllBriefs();

  return (
    <BriefsOverview
      templates={templateData?.data ?? []}
      submissions={briefData?.data ?? []}
      isLoading={templatesLoading || briefsLoading}
    />
  );
}
