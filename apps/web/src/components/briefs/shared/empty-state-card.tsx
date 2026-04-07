import { Card, Button } from "@novabots/ui";

interface EmptyStateCardProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyStateCard({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateCardProps) {
  return (
    <Card className="rounded-3xl py-16 text-center">
      <div className="mx-auto max-w-md space-y-3">
        <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
        <p className="text-sm leading-6 text-[rgb(var(--text-secondary))]">{description}</p>
        {actionLabel && onAction ? (
          <div className="pt-2">
            <Button onClick={onAction}>{actionLabel}</Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

