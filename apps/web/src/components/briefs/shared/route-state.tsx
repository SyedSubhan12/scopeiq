import Link from "next/link";
import { AlertTriangle, FileSearch, RotateCcw } from "lucide-react";
import { Button, Card } from "@novabots/ui";

export function BriefRouteLoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-36 animate-pulse rounded-3xl bg-white" />
      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="h-[480px] animate-pulse rounded-3xl bg-white" />
        <div className="h-[480px] animate-pulse rounded-3xl bg-white" />
      </div>
    </div>
  );
}

export function BriefRouteErrorState({
  title = "Something went wrong",
  description = "The brief module could not load this page right now.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="rounded-3xl py-16 text-center">
      <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-status-red" />
      <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[rgb(var(--text-secondary))]">
        {description}
      </p>
      {onRetry ? (
        <div className="mt-6">
          <Button onClick={onRetry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export function BriefRouteNotFoundState({
  title = "Record not found",
  description = "The brief record you are trying to open does not exist or is no longer available.",
  backHref = "/briefs",
  backLabel = "Back to Briefs",
}: {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <Card className="rounded-3xl py-16 text-center">
      <FileSearch className="mx-auto mb-4 h-10 w-10 text-[rgb(var(--text-muted))]" />
      <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[rgb(var(--text-secondary))]">
        {description}
      </p>
      <div className="mt-6">
        <Link href={backHref}>
          <Button variant="secondary">{backLabel}</Button>
        </Link>
      </div>
    </Card>
  );
}
