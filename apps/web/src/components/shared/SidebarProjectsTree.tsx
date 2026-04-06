"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, FolderKanban } from "lucide-react";
import { cn, Skeleton } from "@novabots/ui";
import { useProjects } from "@/hooks/useProjects";

type ProjectRow = { id: string; name?: string };

export function SidebarProjectsTree() {
  const pathname = usePathname();
  const underProjects = pathname.startsWith("/projects");
  const [open, setOpen] = useState(underProjects);

  useEffect(() => {
    setOpen(underProjects);
  }, [underProjects]);

  const { data, isLoading } = useProjects({ limit: 5 });
  const projects = (data?.data ?? []) as ProjectRow[];

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger
        type="button"
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium outline-none transition-colors duration-200",
          "text-white/75 hover:bg-white/10 hover:text-white",
          "focus-visible:ring-2 focus-visible:ring-primary-mid/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--primary-dark))]",
          underProjects && !open && "bg-white/10 text-white",
        )}
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-white/70 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
        <FolderKanban className="h-5 w-5 shrink-0 text-white/85" aria-hidden />
        <span className="min-w-0 flex-1 truncate">Projects</span>
      </Collapsible.Trigger>
      <Collapsible.Content className="overflow-hidden data-[state=closed]:hidden">
        <div className="space-y-0.5 border-l border-white/15 py-1 pl-3 ml-3">
          <Link
            href="/projects"
            className={cn(
              "block rounded-md px-2 py-1.5 text-xs font-medium outline-none transition-colors",
              pathname === "/projects"
                ? "bg-white/15 text-white"
                : "text-white/65 hover:bg-white/10 hover:text-white",
              "focus-visible:ring-2 focus-visible:ring-primary-mid/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[rgb(var(--primary-dark))]",
            )}
          >
            View all projects
          </Link>
          {isLoading && (
            <div className="space-y-1 px-2 py-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
          {!isLoading && projects.length === 0 && (
            <p className="px-2 py-1 text-xs text-white/50">No projects yet</p>
          )}
          {projects.map((p) => {
            const href = `/projects/${p.id}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={p.id}
                href={href}
                className={cn(
                  "block truncate rounded-md px-2 py-1.5 text-xs font-medium outline-none transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/65 hover:bg-white/10 hover:text-white",
                  "focus-visible:ring-2 focus-visible:ring-primary-mid/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[rgb(var(--primary-dark))]",
                )}
              >
                {p.name ?? "Untitled project"}
              </Link>
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
