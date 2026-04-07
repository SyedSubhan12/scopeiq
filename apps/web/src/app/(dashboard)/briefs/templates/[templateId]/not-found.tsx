import { BriefRouteNotFoundState } from "@/components/briefs/shared/route-state";

export default function BriefTemplateDetailNotFound() {
  return (
    <BriefRouteNotFoundState
      title="Template not found"
      description="The brief template you requested does not exist or is no longer available."
      backHref="/briefs/templates"
      backLabel="Back to templates"
    />
  );
}

