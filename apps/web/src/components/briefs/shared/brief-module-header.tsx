import { Card, cn } from "@novabots/ui";

interface BriefModuleHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function BriefModuleHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: BriefModuleHeaderProps) {
  return (
    <Card
      className={cn(
        "rounded-3xl border-[rgb(var(--border-subtle))] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-5 shadow-[0_24px_50px_-36px_rgba(15,23,42,0.35)] sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-semibold tracking-[-0.03em] text-[rgb(var(--text-primary))] sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--text-secondary))] sm:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </Card>
  );
}

