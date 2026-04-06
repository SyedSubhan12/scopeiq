"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ShieldAlert, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, Skeleton, Button } from "@novabots/ui";
import { useProjectSow } from "@/hooks/useSow";
import { useScopeFlags } from "@/hooks/useScopeFlags";
import { ScopeMeter } from "@/components/scope-guard/ScopeMeter";
import { SowUploader } from "@/components/scope-guard/SowUploader";
import { SowClauseEditor } from "@/components/scope-guard/SowClauseEditor";
import { ScopeFlagList } from "@/components/scope-guard/ScopeFlagList";
import { ScopeFlagCard } from "@/components/scope-guard/ScopeFlagCard";
import { ScopeFlagDetail } from "@/components/scope-guard/ScopeFlagDetail";
import { MessageIngestInput } from "@/components/scope-guard/MessageIngestInput";

type SowState = "none" | "parsing" | "needs_review" | "active";

export default function ScopeGuardPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: sowData, isLoading: sowLoading } = useProjectSow(projectId);
  const { data: flagsData, isLoading: flagsLoading } = useScopeFlags(projectId);

  const [showUploader, setShowUploader] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<any>(null);

  const sow = sowData?.data ?? null;
  const flags: any[] = flagsData?.data ?? [];

  // Determine SOW state
  const sowState: SowState = (() => {
    if (!sow) return "none";
    if (!sow.parsedAt && (!sow.clauses || sow.clauses.length === 0)) return "parsing";
    if (!sow.parsedAt) return "needs_review";
    return "active";
  })();

  // Calculate scope utilization percentage
  const pendingFlags = flags.filter((f) => f.status === "pending").length;
  const confirmedFlags = flags.filter((f) => f.status === "confirmed" || f.status === "change_order_sent").length;
  const totalClauses = sow?.clauses?.length ?? 0;
  const scopePercentage = totalClauses > 0
    ? Math.min(100, Math.round(((confirmedFlags + pendingFlags) / Math.max(totalClauses, 1)) * 100))
    : Math.min(100, pendingFlags * 15 + confirmedFlags * 20);

  if (sowLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with ScopeMeter */}
      <div className="flex flex-col gap-6 rounded-2xl border border-[rgb(var(--border-subtle))] bg-gradient-to-br from-[rgb(var(--surface-subtle))] to-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Scope Guard
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Monitor scope creep, manage change orders, and protect project boundaries.
          </p>
          {sowState === "active" && sow && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              SOW Active: {sow.title}
            </div>
          )}
          {sowState === "parsing" && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              SOW parsing in progress...
            </div>
          )}
          {sowState === "needs_review" && sow && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600">
              <FileText className="h-3.5 w-3.5" />
              SOW needs review: {sow.title}
            </div>
          )}
        </div>

        <ScopeMeter
          percentage={scopePercentage}
          label={
            scopePercentage < 50 ? "Under Budget" :
            scopePercentage < 80 ? "Near Cap" : "Over Scope"
          }
          size={160}
        />
      </div>

      {/* SOW State-based content */}
      {sowState === "none" && !showUploader && (
        <Card className="border-dashed py-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--text-muted))]" />
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            No Statement of Work attached
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            Upload your SOW to enable automated scope monitoring and change order management.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setShowUploader(true)}>
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Upload SOW
          </Button>
        </Card>
      )}

      {showUploader && (
        <SowUploader
          projectId={projectId}
          onComplete={() => setShowUploader(false)}
          onCancel={() => setShowUploader(false)}
        />
      )}

      {sowState === "parsing" && (
        <Card className="border-amber-200 bg-amber-50/50 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            SOW is being parsed by AI
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            Clauses will appear once parsing is complete. This usually takes a minute.
          </p>
        </Card>
      )}

      {sowState === "needs_review" && sow && (
        <SowClauseEditor
          sow={sow}
          projectId={projectId}
          onActivate={() => {/* Refresh happens via query invalidation */}}
        />
      )}

      {sowState === "active" && (
        <>
          {/* Pending flags */}
          {pendingFlags > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-secondary))]">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                PENDING FLAGS ({pendingFlags})
              </h3>
              <div className="space-y-3">
                {flags
                  .filter((f) => f.status === "pending")
                  .map((flag) => (
                    <ScopeFlagCard
                      key={flag.id}
                      flag={flag}
                      projectId={projectId}
                      onDetail={() => setSelectedFlag(flag)}
                    />
                  ))}
              </div>
            </section>
          )}

          {/* All flags */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[rgb(var(--text-secondary))]">
              ALL FLAGS
            </h3>
            <ScopeFlagList projectId={projectId} />
          </section>

          {/* Message ingest */}
          <section>
            <MessageIngestInput projectId={projectId} />
          </section>
        </>
      )}

      {/* Flag detail modal */}
      {selectedFlag && (
        <ScopeFlagDetail
          flag={selectedFlag}
          open={!!selectedFlag}
          onClose={() => setSelectedFlag(null)}
          projectId={projectId}
        />
      )}
    </div>
  );
}
