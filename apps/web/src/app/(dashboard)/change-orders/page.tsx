"use client";

import { useState } from "react";
import Link from "next/link";
import { FileSignature, Clock, CheckCircle2, XCircle, Send, DollarSign, Filter, FolderKanban } from "lucide-react";
import { Card, Badge, Button, Skeleton, Dialog, Input, Textarea, useToast } from "@novabots/ui";
import { fetchWithAuth } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { getChangeOrdersQueryOptions, useChangeOrders } from "@/hooks/change-orders";
import { queryClient } from "@/lib/query-client";

const STATUS_FILTERS = ["all", "pending", "sent", "accepted", "declined"];

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; badge: string }> = {
  pending: { icon: Clock, color: "text-amber-500", badge: "pending" },
  sent: { icon: Send, color: "text-blue-500", badge: "active" },
  accepted: { icon: CheckCircle2, color: "text-emerald-500", badge: "active" },
  declined: { icon: XCircle, color: "text-red-500", badge: "flagged" },
};

function COCard({ co, onSend }: { co: any; onSend: (id: string) => void }) {
  const cfg = STATUS_CONFIG[co.status] ?? STATUS_CONFIG['pending']!;
  const StatusIcon = cfg!.icon;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 shrink-0 ${cfg!.color}`} />
            <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{co.title}</p>
            <Badge status={cfg!.badge as any} className="text-[10px] shrink-0">
              {co.status}
            </Badge>
          </div>
          {co.description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-[rgb(var(--text-secondary))]">{co.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-[rgb(var(--text-muted))]">
            {co.amount != null && (
              <span className="flex items-center gap-1 font-medium text-[rgb(var(--text-primary))]">
                <DollarSign className="h-3 w-3" />
                {Number(co.amount).toLocaleString()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <FolderKanban className="h-3 w-3" />
              <Link href={`/projects/${co.projectId}/change-orders`} className="hover:text-primary hover:underline">
                View project
              </Link>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(co.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        {co.status === "pending" && (
          <Button size="sm" onClick={() => onSend(co.id)} className="shrink-0">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Send to client
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function ChangeOrdersPage() {
  useAssetsReady({
    scopeId: "page:change-orders",
    tasks: [() => queryClient.ensureQueryData(getChangeOrdersQueryOptions())],
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { data, isLoading, refetch } = useChangeOrders();
  const { toast } = useToast();

  const cos: any[] = data?.data ?? [];
  const filtered = statusFilter === "all" ? cos : cos.filter((c) => c.status === statusFilter);

  const pendingCount = cos.filter((c) => c.status === "pending").length;
  const totalValue = cos
    .filter((c) => c.status === "accepted")
    .reduce((s, c) => s + (Number(c.amount) || 0), 0);

  async function handleSend(id: string) {
    setSendingId(id);
    try {
      await fetchWithAuth(`/v1/change-orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "sent" }),
      });
      void refetch();
      toast("success", "Change order sent to client");
    } catch {
      toast("error", "Failed to send change order");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
            <FileSignature className="h-6 w-6 text-primary" />
            Change Orders
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Manage scope change requests across all projects
          </p>
        </div>
        {totalValue > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
            <span className="text-[rgb(var(--text-muted))]">Accepted value: </span>
            <span className="font-semibold text-emerald-700">${totalValue.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5">
        <Filter className="h-4 w-4 text-[rgb(var(--text-muted))]" />
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle))]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <FileSignature className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--text-muted))]" />
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {statusFilter === "all" ? "No change orders yet" : `No ${statusFilter} change orders`}
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            Create change orders from detected scope flags in your projects.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((co: any) => (
            <COCard key={co.id} co={co} onSend={(id) => void handleSend(id)} />
          ))}
        </div>
      )}
    </div>
  );
}
