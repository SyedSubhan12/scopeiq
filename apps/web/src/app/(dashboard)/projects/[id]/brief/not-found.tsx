import { BriefRouteNotFoundState } from "@/components/briefs/shared/route-state";

export default function ProjectBriefNotFound() {
  return (
    <BriefRouteNotFoundState
      title="Project brief not found"
      description="There is no accessible brief view for this project."
      backHref="/projects"
      backLabel="Back to projects"
    />
  );
}
