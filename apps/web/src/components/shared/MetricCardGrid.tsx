"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp, TrendingDown, FolderOpen, Eye, AlertTriangle, DollarSign } from "lucide-react";
import type { DashboardMetrics } from "@/hooks/useDashboard";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

function AnimatedNumber({ value, duration = 1000 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, inView, duration]);

  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
}

interface MetricCardItem {
  label: string;
  value: number;
  icon: typeof FolderOpen;
  color: string;
  bgColor: string;
  trend?: { value: number; direction: "up" | "down" };
}

interface MetricCardGridProps {
  metrics: DashboardMetrics;
}

const cardConfigs: ((metrics: DashboardMetrics) => MetricCardItem)[] = [
  (m) => ({
    label: "Active Projects",
    value: m.activeProjects,
    icon: FolderOpen,
    color: "text-primary",
    bgColor: "bg-primary/10",
  }),
  (m) => ({
    label: "Awaiting Approval",
    value: m.awaitingApproval,
    icon: Eye,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  }),
  (m) => ({
    label: "Pending Scope Flags",
    value: m.pendingScopeFlags,
    icon: AlertTriangle,
    color: "text-status-red",
    bgColor: "bg-status-red/10",
  }),
  (m) => ({
    label: "MRR",
    value: m.mrr,
    icon: DollarSign,
    color: "text-status-green",
    bgColor: "bg-status-green/10",
    trend: { value: 0, direction: "up" },
  }),
];

export function MetricCardGrid({ metrics }: MetricCardGridProps) {
  const cards = cardConfigs.map((fn) => fn(metrics));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
            className="rounded-xl border border-[rgb(var(--border-default))] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-[rgb(var(--text-primary))]">
                  {card.label === "MRR" ? "$" : ""}
                  <AnimatedNumber value={card.value} duration={800 + index * 100} />
                </p>
                {card.trend && (
                  <span
                    className={`mt-1 inline-flex items-center text-xs font-medium ${
                      card.trend.direction === "up"
                        ? "text-status-green"
                        : "text-status-red"
                    }`}
                  >
                    {card.trend.direction === "up" ? (
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-0.5 h-3 w-3" />
                    )}
                    {card.trend.value}%
                  </span>
                )}
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bgColor}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
