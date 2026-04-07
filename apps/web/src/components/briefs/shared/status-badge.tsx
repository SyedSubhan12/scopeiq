import { Badge } from "@novabots/ui";
import {
  getReviewStatusMeta,
  getTemplateStatusMeta,
  type ReviewStatus,
  type TemplateStatus,
} from "@/lib/briefs";

interface StatusBadgeProps {
  status: ReviewStatus | TemplateStatus;
  kind?: "review" | "template";
}

export function StatusBadge({ status, kind = "review" }: StatusBadgeProps) {
  const meta =
    kind === "template"
      ? getTemplateStatusMeta(status as TemplateStatus)
      : getReviewStatusMeta(status as ReviewStatus);

  return <Badge status={meta.badgeStatus}>{meta.label}</Badge>;
}

