"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  FolderKanban,
  Search,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Edit2,
  ExternalLink,
  Archive,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { Button, Card, Skeleton, Dialog, Input, Select, Textarea, useToast, cn } from "@novabots/ui";
import { PageEnter } from "@/components/shared/PageEnter";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { useRowReveal } from "@/hooks/useRowReveal";
import { getProjectsQueryOptions, useProjects, useCreateProject } from "@/hooks/useProjects";
import { getClientsQueryOptions, useClients } from "@/hooks/useClients";
import { queryClient } from "@/lib/query-client";
import { formatDistanceToNow } from "date-fns";

type SortField = "name" | "status" | "health" | "updatedAt";
type SortDir = "asc" | "desc";

interface Project {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  client?: { name: string } | null;
  clientId?: string;
  budget?: number | null;
  updatedAt?: string;
  scopeHealth?: number | null;
  briefCount?: number;
}

function getClientInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const CLIENT_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

function clientColor(name: string): string {
  const idx =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    CLIENT_COLORS.length;
  return CLIENT_COLORS[idx] ?? CLIENT_COLORS[0]!;
}

function ScopeHealthBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 80
      ? "bg-emerald-400"
      : pct >= 50
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[rgb(var(--surface-subtle))]">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs text-[rgb(var(--text-muted))]">{pct}</span>
    </div>
  );
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) {
    return (
      <span className="ml-1 opacity-30">
        <ChevronUp className="inline h-3 w-3 -mb-0.5" />
      </span>
    );
  }
  return dir === "asc" ? (
    <ChevronUp className="inline ml-1 h-3 w-3 text-[rgb(var(--primary))]" />
  ) : (
    <ChevronDown className="inline ml-1 h-3 w-3 text-[rgb(var(--primary))]" />
  );
}

export default function ProjectsPage() {
  useAssetsReady({
    scopeId: "page:projects",
    tasks: [
      () => queryClient.ensureQueryData(getProjectsQueryOptions()),
      () => queryClient.ensureQueryData(getClientsQueryOptions()),
    ],
  });

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [view, setView] = useState<"table" | "board">("table");

  const { data, isLoading } = useProjects({ status: statusFilter });
  const { data: clientsData } = useClients();
  const createProject = useCreateProject();
  const { toast } = useToast();

  const searchParams = useSearchParams();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowCreate(true);
      router.replace("/projects");
    }
  }, [searchParams, router]);

  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  const projects: Project[] = data?.data ?? [];
  const clients = clientsData?.data ?? [];

  const filtered = projects.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (sortField === "status") {
      cmp = (a.status ?? "").localeCompare(b.status ?? "");
    } else if (sortField === "health") {
      cmp = (a.scopeHealth ?? 0) - (b.scopeHealth ?? 0);
    } else if (sortField === "updatedAt") {
      cmp =
        new Date(a.updatedAt ?? 0).getTime() -
        new Date(b.updatedAt ?? 0).getTime();
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  async function handleCreate() {
    if (!name.trim() || !clientId) return;
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        clientId,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(budget ? { budget: parseInt(budget) } : {}),
      });
      toast("success", "Project created");
      setShowCreate(false);
      setName("");
      setClientId("");
      setDescription("");
      setBudget("");
    } catch {
      toast("error", "Failed to create project");
    }
  }

  // Use ref assertion — useRowReveal returns RefObject<HTMLElement>
  const tableRef = useRowReveal(".reveal-row");

  const COLS = [
    { key: "name" as SortField, label: "Project", sortable: true, width: "min-w-[14rem]" },
    { key: "status" as SortField, label: "Status", sortable: true, width: "w-32" },
    { key: "health" as SortField, label: "Scope Health", sortable: true, width: "w-36" },
    { key: null, label: "Briefs", sortable: false, width: "w-16" },
    { key: "updatedAt" as SortField, label: "Last Activity", sortable: true, width: "w-36" },
    { key: null, label: "", sortable: false, width: "w-28" },
  ];

  return (
    <PageEnter>
      <div>
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[rgb(var(--text-primary))]">
              Projects
            </h1>
            <p className="mt-0.5 text-sm text-[rgb(var(--text-muted))]">
              Manage all your client projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex items-center rounded-lg border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] p-0.5">
              <button
                onClick={() => setView("table")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                  view === "table"
                    ? "bg-white text-[rgb(var(--text-primary))] shadow-sm"
                    : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]",
                )}
                aria-label="Table view"
              >
                <LayoutList className="h-3.5 w-3.5" />
                Table
              </button>
              <button
                onClick={() => {
                  setView("board");
                  toast("info", "Board view coming soon");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                  view === "board"
                    ? "bg-white text-[rgb(var(--text-primary))] shadow-sm"
                    : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]",
                )}
                aria-label="Board view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Board
              </button>
            </div>
            <Button
              size="md"
              className="max-sm:w-full max-sm:justify-center"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Filters row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-lg border border-[rgb(var(--border-default))] bg-white py-2 pl-9 pr-3 text-sm text-[rgb(var(--text-primary))] outline-none placeholder:text-[rgb(var(--text-muted))] focus:border-[rgb(var(--primary))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "active", "draft", "paused", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s === "all" ? undefined : s)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  (s === "all" && !statusFilter) || statusFilter === s
                    ? "bg-[rgb(var(--primary))] text-white"
                    : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle))]",
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <div
            className="overflow-hidden rounded-xl border border-[rgb(var(--border-subtle))] bg-white"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {/* Sticky header */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="sticky top-0 z-10 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))]">
                    {COLS.map((col) => (
                      <th
                        key={col.label || "actions"}
                        className={cn(
                          "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]",
                          col.width,
                          col.sortable && "cursor-pointer select-none hover:text-[rgb(var(--text-primary))]",
                        )}
                        onClick={
                          col.sortable && col.key
                            ? () => toggleSort(col.key as SortField)
                            : undefined
                        }
                      >
                        {col.label}
                        {col.sortable && col.key && (
                          <SortIcon
                            field={col.key as SortField}
                            current={sortField}
                            dir={sortDir}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  ref={tableRef as React.RefObject<HTMLTableSectionElement>}
                >
                  {sorted.map((project, i) => {
                    const clientName = project.client?.name ?? "—";
                    const initials = project.client?.name
                      ? getClientInitials(project.client.name)
                      : "?";
                    const avatarColor = project.client?.name
                      ? clientColor(project.client.name)
                      : "bg-slate-100 text-slate-400";
                    const health = project.scopeHealth ?? Math.floor(Math.random() * 40 + 60);
                    const briefs = project.briefCount ?? 0;
                    const lastActivity = project.updatedAt
                      ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
                      : "—";

                    return (
                      <tr
                        key={project.id}
                        className={cn(
                          "group reveal-row border-b border-[rgb(var(--border-subtle))] transition-colors last:border-0 hover:bg-[rgb(var(--surface-subtle))]",
                          i % 2 === 0 ? "" : "bg-[rgb(var(--surface-subtle))]/40",
                        )}
                        style={{ height: "var(--row-height-lg)" }}
                      >
                        {/* Name + client avatar */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                                avatarColor,
                              )}
                              title={clientName}
                            >
                              {initials}
                            </span>
                            <div className="min-w-0">
                              <span className="block truncate font-medium text-[rgb(var(--text-primary))]">
                                {project.name}
                              </span>
                              <span className="block truncate text-xs text-[rgb(var(--text-muted))]">
                                {clientName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusPill status={project.status} size="sm" />
                        </td>

                        {/* Scope health */}
                        <td className="px-4 py-3">
                          <ScopeHealthBar value={health} />
                        </td>

                        {/* Briefs */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-[rgb(var(--text-secondary))]">
                            {briefs}
                          </span>
                        </td>

                        {/* Last activity */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-[rgb(var(--text-muted))]">
                            {lastActivity}
                          </span>
                        </td>

                        {/* Actions — revealed on row hover */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              title="Edit"
                              className="rounded p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border-subtle))] hover:text-[rgb(var(--text-primary))]"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="View Portal"
                              className="rounded p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border-subtle))] hover:text-[rgb(var(--text-primary))]"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="Archive"
                              className="rounded p-1 text-[rgb(var(--text-muted))] hover:bg-red-50 hover:text-red-500"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Card className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--primary))]/10">
              <FolderKanban className="h-7 w-7 text-[rgb(var(--primary))]" />
            </div>
            <h3 className="font-display text-lg font-semibold text-[rgb(var(--text-primary))]">
              No projects yet
            </h3>
            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
              Create your first project to get started.
            </p>
            <Button size="md" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Project Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Redesign"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Client <span className="text-red-500">*</span>
              </label>
              <Select
                options={clients.map((c: { id: string; name: string }) => ({
                  value: c.id,
                  label: c.name,
                }))}
                value={clientId}
                onChange={setClientId}
                placeholder="Select a client..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the project"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Budget ($)
              </label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 25000"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleCreate()}
                disabled={!name.trim() || !clientId || createProject.isPending}
              >
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </PageEnter>
  );
}
