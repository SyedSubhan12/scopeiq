"use client";

import Link from "next/link";
import {
  FolderKanban,
  FileText,
  ShieldAlert,
  FileSignature,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Plus,
  AlertCircle,
} from "lucide-react";
import { MetricCard, Card, Badge, Button, Skeleton } from "@novabots/ui";
import { useProjects } from "@/hooks/useProjects";
import { useBriefTemplates } from "@/hooks/useBriefTemplates";
import { useClients } from "@/hooks/useClients";

export default function DashboardPage() {
  const { data: projectsData, isLoading: loadingProjects } = useProjects({ limit: 5 });
  const { data: templatesData, isLoading: loadingTemplates } = useBriefTemplates();
  const { data: clientsData, isLoading: loadingClients } = useClients();

  const projects = projectsData?.data ?? [];
  const templates = templatesData?.data ?? [];
  const clients = clientsData?.data ?? [];

  const activeProjects = projects.filter(
    (p: { status: string }) => p.status === "active",
  ).length;
  const draftProjects = projects.filter(
    (p: { status: string }) => p.status === "draft",
  ).length;

  const isLoading = loadingProjects || loadingTemplates || loadingClients;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Dashboard</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Overview of your workspace activity
        </p>
      </div>

      {/* Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Active Projects" value={activeProjects} />
          <MetricCard label="Brief Templates" value={templates.length} />
          <MetricCard label="Clients" value={clients.length} />
          <MetricCard label="Draft Projects" value={draftProjects} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
              Recent Projects
            </h2>
            <Link
              href="/projects"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-2">
              {projects
                .slice(0, 5)
                .map(
                  (project: {
                    id: string;
                    name: string;
                    status: string;
                    client?: { name: string } | null;
                    budget?: number | null;
                    updatedAt?: string;
                  }) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card hoverable className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <FolderKanban className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                              {project.name}
                            </p>
                            <p className="text-xs text-[rgb(var(--text-muted))]">
                              {project.client?.name ?? "No client"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {project.budget != null && (
                            <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                              ${project.budget.toLocaleString()}
                            </span>
                          )}
                          <Badge
                            status={
                              project.status as
                                | "active"
                                | "draft"
                                | "paused"
                                | "completed"
                            }
                          >
                            {project.status}
                          </Badge>
                        </div>
                      </Card>
                    </Link>
                  ),
                )}
            </div>
          ) : (
            <Card className="py-10 text-center">
              <FolderKanban className="mx-auto mb-3 h-8 w-8 text-[rgb(var(--text-muted))]" />
              <p className="text-sm text-[rgb(var(--text-muted))]">
                No projects yet
              </p>
              <Link href="/projects">
                <Button size="sm" className="mt-3">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create Project
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 text-base font-semibold text-[rgb(var(--text-primary))]">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <Link href="/projects">
              <Card hoverable className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <FolderKanban className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    New Project
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    Start a new client project
                  </p>
                </div>
              </Card>
            </Link>

            <Link href="/briefs">
              <Card hoverable className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    Brief Templates
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    Create or edit intake forms
                  </p>
                </div>
              </Card>
            </Link>

            <Link href="/clients">
              <Card hoverable className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                  <Plus className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    Add Client
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    Register a new client
                  </p>
                </div>
              </Card>
            </Link>

            <Link href="/settings">
              <Card hoverable className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                  <FileSignature className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    Rate Card
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    Manage service pricing
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
