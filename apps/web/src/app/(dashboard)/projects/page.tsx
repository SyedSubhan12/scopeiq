"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Search } from "lucide-react";
import { Button, Badge, Card, Skeleton, Dialog, Input, Select, Textarea, useToast } from "@novabots/ui";
import { useProjects, useCreateProject } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useProjects({ status: statusFilter });
  const { data: clientsData } = useClients();
  const createProject = useCreateProject();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  const projects = data?.data ?? [];
  const clients = clientsData?.data ?? [];

  const filtered = projects.filter(
    (p: { name: string }) =>
      !search || p.name.toLowerCase().includes(search.toLowerCase()),
  );

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Projects</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Manage all your client projects
          </p>
        </div>
        <Button size="md" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-lg border border-[rgb(var(--border-default))] py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "draft", "paused", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === "all" ? undefined : s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                (s === "all" && !statusFilter) || statusFilter === s
                  ? "bg-primary text-white"
                  : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle))]"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((project: { id: string; name: string; status: string; description?: string | null; client?: { name: string } | null; budget?: number | null; updatedAt?: string }) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card hoverable className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[rgb(var(--text-primary))]">{project.name}</h3>
                    <p className="text-sm text-[rgb(var(--text-muted))]">
                      {project.client?.name ?? "No client"}
                      {project.description && ` \u2022 ${project.description.slice(0, 60)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {project.budget != null && (
                    <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                      ${project.budget.toLocaleString()}
                    </span>
                  )}
                  <Badge status={project.status as "active" | "draft" | "paused" | "completed"}>
                    {project.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <FolderKanban className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
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
  );
}
