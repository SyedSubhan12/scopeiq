"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@novabots/ui";
import { BriefList } from "@/components/brief/BriefList";
import { BriefDetail } from "@/components/brief/BriefDetail";
import { useBriefs, type Brief } from "@/hooks/useBriefs";

export default function ProjectBriefsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data, isLoading } = useBriefs(projectId);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);

  const briefs: Brief[] = data?.data ?? [];

  if (selectedBrief) {
    return (
      <BriefDetail
        brief={selectedBrief}
        onBack={() => setSelectedBrief(null)}
      />
    );
  }

  return (
    <BriefList
      briefs={briefs}
      isLoading={isLoading}
      onSelect={setSelectedBrief}
    />
  );
}
