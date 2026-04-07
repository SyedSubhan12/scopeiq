import { BriefRouteNotFoundState } from "@/components/briefs/shared/route-state";

export default function BriefSubmissionDetailNotFound() {
  return (
    <BriefRouteNotFoundState
      title="Submission not found"
      description="The brief submission you requested does not exist or is no longer available."
      backHref="/briefs/submissions"
      backLabel="Back to submission queue"
    />
  );
}

