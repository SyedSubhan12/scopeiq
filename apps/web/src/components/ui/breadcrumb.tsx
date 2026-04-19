import * as React from "react";
import Link from "next/link";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@novabots/ui";

/* -----------------------------------------------------------------------
   Breadcrumb — shadcn-compatible, mobile-truncating
   ----------------------------------------------------------------------- */

export const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & { separator?: React.ReactNode }
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    aria-label="breadcrumb"
    className={cn("flex min-w-0 items-center", className)}
    {...props}
  />
));
Breadcrumb.displayName = "Breadcrumb";

export const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex min-w-0 flex-wrap items-center gap-1 text-sm text-[rgb(var(--text-muted))] sm:gap-1.5",
      className,
    )}
    {...props}
  />
));
BreadcrumbList.displayName = "BreadcrumbList";

export const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex min-w-0 items-center gap-1 sm:gap-1.5", className)}
    {...props}
  />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

export const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { href: string }
>(({ className, href, children, ...props }, ref) => (
  <Link
    ref={ref}
    href={href}
    className={cn(
      "min-w-0 truncate transition-colors hover:text-[rgb(var(--text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/50 rounded",
      className,
    )}
    {...(props as Record<string, unknown>)}
  >
    {children}
  </Link>
));
BreadcrumbLink.displayName = "BreadcrumbLink";

export const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn(
      "min-w-0 truncate font-medium text-[rgb(var(--text-primary))]",
      className,
    )}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

export const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5", className)}
    {...props}
  >
    {children ?? (
      <ChevronRight className="text-[rgb(var(--border-strong))]" aria-hidden />
    )}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn(
      "inline-flex h-6 w-6 items-center justify-center rounded text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors",
      className,
    )}
    {...props}
  >
    <MoreHorizontal className="h-3.5 w-3.5" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

/* -----------------------------------------------------------------------
   SmartBreadcrumb — auto-truncates middle items on small screens
   Renders: Home > … > Parent > Current
   ----------------------------------------------------------------------- */

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
}

interface SmartBreadcrumbProps {
  crumbs: BreadcrumbCrumb[];
  /** Max crumbs to show before collapsing middle ones. Default 4 */
  maxVisible?: number;
  className?: string;
}

export function SmartBreadcrumb({
  crumbs,
  maxVisible = 4,
  className,
}: SmartBreadcrumbProps) {
  const [expanded, setExpanded] = React.useState(false);

  const shouldCollapse = !expanded && crumbs.length > maxVisible;
  const visible = shouldCollapse
    ? [crumbs[0]!, ...crumbs.slice(-2)]
    : crumbs;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {visible.map((crumb, index) => {
          const isLast = index === visible.length - 1;
          const isEllipsisSlot =
            shouldCollapse && index === 1 && crumbs.length > maxVisible;

          return (
            <React.Fragment key={crumb.href ?? crumb.label + index}>
              {isEllipsisSlot && (
                <>
                  <BreadcrumbItem>
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      aria-label="Show full path"
                      className="inline-flex"
                    >
                      <BreadcrumbEllipsis />
                    </button>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
