"use client";

import { BriefModuleHeader } from "@/components/briefs/shared/brief-module-header";
import { SubmissionTable } from "@/components/briefs/submissions/submission-table";
import { useAllBriefs } from "@/hooks/useBriefs";

export default function BriefSubmissionsPage() {
  const { data, isLoading } = useAllBriefs();

  return (
    <div className="space-y-6">
      <BriefModuleHeader
        eyebrow="Submission queue"
        title="Brief submissions"
        description="Review every submitted brief in one queue, then open the right record to approve, hold, or clarify before work starts."
      />
      <SubmissionTable briefs={data?.data ?? []} isLoading={isLoading} />
    </div>
  );
}

