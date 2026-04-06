"use client";

import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { ChangeOrderView } from "@/components/portal/ChangeOrderView";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import { Skeleton } from "@novabots/ui";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ChangeOrderDetail {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  status: string;
  sentAt: string | null;
  respondedAt: string | null;
}

function ChangeOrderPageContent({ changeOrderId }: { changeOrderId: string }) {
  const session = usePortalSession();
  const [changeOrder, setChangeOrder] = useState<ChangeOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.token || !changeOrderId) return;

    const fetchChangeOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/portal/change-orders/${changeOrderId}`, {
          headers: { "X-Portal-Token": session.token },
        });
        if (!res.ok) throw new Error("Failed to load change order");
        const json = await res.json();
        setChangeOrder(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    void fetchChangeOrder();
  }, [session.token, changeOrderId, session.loading]);

  if (session.loading || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (session.error || error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-[rgb(var(--border-default))] max-w-md w-full">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
            {error || "Link Invalid or Expired"}
          </h2>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))] leading-relaxed">
            {session.error || "Please contact your agency for a new portal link."}
          </p>
          <button
            className="mt-6 w-full rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--surface-subtle))]"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { project, workspace } = session;

  if (!changeOrder) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border-default))] bg-white p-16">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            Change order not found
          </h3>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
            This change order does not exist or has been removed.
          </p>
          <Link
            href={`/portal/${session.token}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--surface-subtle))]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${workspace.brandColor}08` }}>
      <PortalHeader
        workspaceName={workspace.name}
        logoUrl={workspace.logoUrl}
        brandColor={workspace.brandColor}
        projectName={project.name}
        clientName={project.clientName}
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
          <Link
            href={`/portal/${session.token}`}
            className="hover:text-[rgb(var(--text-secondary))]"
          >
            Portal
          </Link>
          <span>/</span>
          <span className="text-[rgb(var(--text-primary))]">Change Order</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Change Order</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Review the details below and accept or decline this change order.
          </p>
        </div>

        <ChangeOrderView
          changeOrder={changeOrder}
          portalToken={session.token}
          onResponded={() => {
            // Navigate back to portal after a short delay (handled by ChangeOrderView)
          }}
        />

        <div className="mt-8">
          <PoweredByBadge plan={workspace.plan} />
        </div>
      </main>
    </div>
  );
}

export default function ChangeOrderPage({
  params,
}: {
  params: { portalToken: string; id: string };
}) {
  return (
    <PortalSessionProvider portalToken={params.portalToken}>
      <ChangeOrderPageContent changeOrderId={params.id} />
    </PortalSessionProvider>
  );
}
