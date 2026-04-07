"use client";

import { useParams } from "next/navigation";
import { SubmissionReviewView } from "@/components/briefs/submissions/submission-review-view";
import { useBrief } from "@/hooks/useBriefs";

export default function BriefSubmissionReviewPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;
  const { data, isLoading } = useBrief(submissionId);

  return <SubmissionReviewView brief={data?.data} isLoading={isLoading} />;
}

