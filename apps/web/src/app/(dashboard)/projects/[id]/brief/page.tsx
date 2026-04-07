"use client";

import { useParams } from "next/navigation";
import { ProjectBriefView } from "@/components/briefs/project/project-brief-view";
import { useBriefs } from "@/hooks/useBriefs";

export default function ProjectBriefPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data, isLoading } = useBriefs(projectId);

  return (
    <ProjectBriefView
      projectId={projectId}
      briefs={data?.data ?? []}
      isLoading={isLoading}
    />
  );
}
