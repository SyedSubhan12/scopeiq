"use client";

/**
 * Animated project card — FEAT-NEW-011 + Sprint animation pass.
 *
 * GSAP back.out(1.4) entrance on mount.
 * Framer Motion hover lift.
 * ProjectHealthRing shows the /health score inline.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderKanban } from "lucide-react";
import { Badge, Card, cn } from "@novabots/ui";
import { ProjectHealthRing } from "./ProjectHealthRing";
import { useProjectHealth } from "@/hooks/useProjectHealth";

interface Project {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  client?: { name: string } | null;
  budget?: number | null;
  updatedAt?: string;
}

interface AnimatedProjectCardProps {
  project: Project;
  index: number;
}

export function AnimatedProjectCard({ project, index }: AnimatedProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: healthData } = useProjectHealth(project.id);
  const health = healthData?.data;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let cancelled = false;

    void import("gsap/dist/gsap").then((mod) => {
      if (cancelled) return;
      const gsap = (mod as { default: { from: (t: unknown, v: unknown) => void } }).default;
      gsap.from(el, {
        opacity: 0,
        y: 16,
        scale: 0.97,
        duration: 0.4,
        delay: index * 0.06,
        ease: "back.out(1.4)",
        clearProps: "all",
      });
    });

    return () => { cancelled = true; };
  }, [index]);

  return (
    <div ref={cardRef}>
      <Link href={`/projects/${project.id}`}>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
          <Card
            hoverable
            className="flex items-center gap-3 p-3 sm:p-4"
          >
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>

            {/* Name + client */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-[rgb(var(--text-primary))] sm:text-base">
                {project.name}
              </h3>
              <p className="truncate text-xs text-[rgb(var(--text-muted))] sm:text-sm">
                {project.client?.name ?? "No client"}
                {project.description && (
                  <span className="hidden sm:inline">
                    {" · "}
                    {project.description.slice(0, 55)}
                  </span>
                )}
              </p>
            </div>

            {/* Right side: budget + badge + health ring */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {project.budget != null && (
                <span className="hidden text-sm font-medium text-[rgb(var(--text-secondary))] lg:inline">
                  ${project.budget.toLocaleString()}
                </span>
              )}
              <Badge status={project.status as "active" | "draft" | "paused" | "completed"}>
                <span className="hidden xs:inline">{project.status}</span>
                <span className="xs:hidden">{project.status.charAt(0).toUpperCase()}</span>
              </Badge>
              {health !== undefined && (
                <ProjectHealthRing
                  score={health.overallScore}
                  health={health}
                  size={40}
                  strokeWidth={3.5}
                />
              )}
            </div>
          </Card>
        </motion.div>
      </Link>
    </div>
  );
}
