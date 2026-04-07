"use client";

import { useState } from "react";
import { ArrowLeft, Clock, Shield } from "lucide-react";
import { Card, Badge, Button, Dialog, Input } from "@novabots/ui";
import { ClarityScoreRing } from "./ClarityScoreRing";
import { BriefFlagCard } from "./BriefFlagCard";
import type { Brief } from "@/hooks/useBriefs";

interface BriefDetailProps {
  brief: Brief;
  onBack: () => void;
  onOverrideFlag?: (flagId: string) => void;
  onOverrideBrief?: (reason: string) => void;
  overriding?: boolean;
}

const statusConfig: Record<Brief["status"], { label: string; badgeStatus: string }> = {
  pending_score: { label: "Pending score", badgeStatus: "draft" },
  scoring: { label: "Scoring", badgeStatus: "active" },
  scored: { label: "Ready", badgeStatus: "active" },
  clarification_needed: { label: "Clarification needed", badgeStatus: "pending" },
  approved: { label: "Approved", badgeStatus: "approved" },
  rejected: { label: "Held", badgeStatus: "flagged" },
};

export function BriefDetail({
  brief,
  onBack,
  onOverrideFlag,
  onOverrideBrief,
  overriding,
}: BriefDetailProps) {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const config = statusConfig[brief.status];

  const handleOverride = () => {
    if (overrideReason.trim() && onOverrideBrief) {
      onOverrideBrief(overrideReason.trim());
      setShowOverrideModal(false);
      setOverrideReason("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 rounded-md p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
              Brief #{brief.id.slice(0, 8)}
            </h2>
            <Badge status={config.badgeStatus as "approved" | "draft" | "active" | "flagged" | "pending"}>
              {config.label}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-[rgb(var(--text-muted))]">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(brief.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        <ClarityScoreRing score={brief.scopeScore ?? 0} size={80} strokeWidth={8} />
      </div>

      {/* Override button for flagged/held briefs */}
      {(brief.status === "clarification_needed" || brief.status === "rejected") && onOverrideBrief && (
        <Card className="flex items-center justify-between bg-amber-50 p-4">
          <div>
            <p className="text-sm font-medium text-amber-800">
              This brief has been held due to low clarity score.
            </p>
            <p className="mt-0.5 text-xs text-amber-600">
              Override to approve it anyway. A reason is required for audit purposes.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowOverrideModal(true)}>
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Override
          </Button>
        </Card>
      )}

      {/* Field Values */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-[rgb(var(--text-primary))]">
          Submitted Responses
        </h3>
        {(brief.fields ?? []).length === 0 ? (
          <p className="py-4 text-center text-sm text-[rgb(var(--text-muted))]">
            No field values available.
          </p>
        ) : (
          <div className="divide-y divide-[rgb(var(--border-default))]">
            {(brief.fields ?? []).map((field) => (
              <div key={field.fieldKey} className="py-3 first:pt-0 last:pb-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
                  {field.fieldLabel}
                </p>
                <p className="mt-1 text-sm text-[rgb(var(--text-primary))]">
                  {field.value || "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* AI Flags */}
      {brief.flags.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[rgb(var(--text-primary))]">
            AI Flags ({brief.flags.length})
          </h3>
          <div className="space-y-2">
            {brief.flags.map((flag) => (
              <BriefFlagCard
                key={flag.id}
                flag={flag}
                {...(onOverrideFlag ? { onOverride: onOverrideFlag } : {})}
                {...(overriding !== undefined ? { overriding } : {})}
              />
            ))}
          </div>
        </div>
      )}

      {/* Override Modal */}
      <Dialog
        open={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        title="Override Brief Hold"
      >
        <div className="space-y-4">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Provide a reason for overriding the auto-hold. This will be logged in the audit trail.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Reason <span className="text-red-500">*</span>
            </label>
            <Input
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Client provided additional context via email"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" onClick={() => setShowOverrideModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleOverride}
              disabled={!overrideReason.trim() || overriding}
            >
              {overriding ? "Overriding..." : "Confirm Override"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
