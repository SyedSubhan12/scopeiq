import { Badge } from "@novabots/ui";
import { getScoreTone } from "@/lib/briefs";

interface ScorePillProps {
  score?: number | null | undefined;
}

export function ScorePill({ score }: ScorePillProps) {
  if (score == null) {
    return <Badge status="draft">Pending score</Badge>;
  }

  return <Badge status={getScoreTone(score)}>{score}/100 clarity</Badge>;
}
