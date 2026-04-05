"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, User, Copy, Check, ExternalLink } from "lucide-react";
import { Badge, Card, Skeleton } from "@novabots/ui";
import { useProject } from "@/hooks/useProjects";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@novabots/ui";

// Tab content components
import { BriefList } from "@/components/brief/BriefList";
import { BriefDetail } from "@/components/brief/BriefDetail";
import { DeliverableList } from "@/components/approval/DeliverableList";
import { DeliverableViewer } from "@/components/approval/DeliverableViewer";
import { DeliverableUploader } from "@/components/approval/DeliverableUploader";
import { FeedbackPanel } from "@/components/approval/FeedbackPanel";
import { RevisionCounter } from "@/components/approval/RevisionCounter";
import { useBriefs, type Brief } from "@/hooks/useBriefs";
import { useDeliverables, type Deliverable } from "@/hooks/useDeliverables";
import { useFeedback, useCreateFeedback, useResolveFeedback, type FeedbackItem } from "@/hooks/useFeedback";
import { useProjectHealth } from "@/hooks/useProjectHealth";
import { Button, useToast } from "@novabots/ui";
import { MapPin, Upload, CheckCircle2, AlertCircle, Clock, TrendingUp } from "lucide-react";

const tabs = [
  { key: "brief", label: "Briefs" },
  { key: "deliverables", label: "Deliverables" },
  { key: "scope-guard", label: "Scope Guard" },
  { key: "change-orders", label: "Change Orders" },
  { key: "health", label: "Health" },
  { key: "log", label: "Activity Log" },
];

function HealthTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectHealth(projectId);
  const health = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <Card className="py-12 text-center">
        <TrendingUp className="mx-auto mb-3 h-8 w-8 text-[rgb(var(--text-muted))]" />
        <p className="text-sm text-[rgb(var(--text-muted))]">Health data not available</p>
      </Card>
    );
  }

  const score = health.overallScore;
  const scoreColor = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  const ringColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="flex items-center gap-6 p-6">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(var(--border-subtle))" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={ringColor} strokeWidth="10"
              strokeDasharray={`${score * 2.513} 251.3`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Project Health Score</h3>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            {score >= 80 ? "This project is on track." : score >= 60 ? "Some issues need attention." : "This project needs immediate review."}
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            Score decreases with pending flags and unresolved deliverable changes.
          </p>
        </div>
      </Card>

      {/* Health metrics grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Scope health */}
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Scope Health</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Pending flags</span>
              <span className={`font-medium ${health.scopeHealth.pendingFlags > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {health.scopeHealth.pendingFlags}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Resolved flags</span>
              <span className="font-medium text-[rgb(var(--text-primary))]">{health.scopeHealth.resolvedFlags}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Open COs</span>
              <span className={`font-medium ${health.scopeHealth.openChangeOrders > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {health.scopeHealth.openChangeOrders}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Accepted COs</span>
              <span className="font-medium text-[rgb(var(--text-primary))]">{health.scopeHealth.acceptedChangeOrders}</span>
            </div>
          </div>
        </Card>

        {/* Brief quality */}
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Brief Quality</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Total briefs</span>
              <span className="font-medium text-[rgb(var(--text-primary))]">{health.briefHealth.totalBriefs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Avg score</span>
              <span className="font-medium text-[rgb(var(--text-primary))]">
                {health.briefHealth.avgScore != null ? `${health.briefHealth.avgScore}/100` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Flagged</span>
              <span className={`font-medium ${health.briefHealth.flaggedCount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {health.briefHealth.flaggedCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Approved</span>
              <span className="font-medium text-emerald-500">{health.briefHealth.approvedCount}</span>
            </div>
          </div>
        </Card>

        {/* Deliverable health */}
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Deliverables</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Total</span>
              <span className="font-medium text-[rgb(var(--text-primary))]">{health.deliverableHealth.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Approved</span>
              <span className="font-medium text-emerald-500">{health.deliverableHealth.approved}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">In review</span>
              <span className="font-medium text-blue-500">{health.deliverableHealth.inReview}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-muted))]">Changes requested</span>
              <span className={`font-medium ${health.deliverableHealth.changesRequested > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {health.deliverableHealth.changesRequested}
              </span>
            </div>
          </div>
        </Card>

        {/* Summary card */}
        <Card className={`p-4 ${score >= 80 ? "border-emerald-200 bg-emerald-50/50" : score >= 60 ? "border-amber-200 bg-amber-50/50" : "border-red-200 bg-red-50/50"}`}>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[rgb(var(--text-muted))]" />
            <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Summary</h4>
          </div>
          <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
            {health.scopeHealth.pendingFlags > 0 && `${health.scopeHealth.pendingFlags} pending scope flag${health.scopeHealth.pendingFlags > 1 ? "s" : ""} need review. `}
            {health.deliverableHealth.changesRequested > 0 && `${health.deliverableHealth.changesRequested} deliverable${health.deliverableHealth.changesRequested > 1 ? "s" : ""} have changes requested. `}
            {health.scopeHealth.openChangeOrders > 0 && `${health.scopeHealth.openChangeOrders} change order${health.scopeHealth.openChangeOrders > 1 ? "s" : ""} awaiting response. `}
            {score >= 80 && "Project is healthy and on track."}
            {score >= 60 && score < 80 && "Some issues need attention to stay on track."}
            {score < 60 && "Immediate review recommended."}
          </p>
        </Card>
      </div>
    </div>
  );
}

function BriefTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useBriefs(projectId);
  const [selected, setSelected] = useState<Brief | null>(null);
  const briefs: Brief[] = data?.data ?? [];

  if (selected) {
    return <BriefDetail brief={selected} onBack={() => setSelected(null)} />;
  }

  return <BriefList briefs={briefs} isLoading={isLoading} onSelect={setSelected} />;
}

function DeliverablesTab({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Deliverable | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [placingPin, setPlacingPin] = useState(false);
  const [activePinId, setActivePinId] = useState<string | null>(null);

  const { data: feedbackData } = useFeedback(selected?.id ?? "");
  const createFeedback = useCreateFeedback(selected?.id ?? "");
  const resolveFeedback = useResolveFeedback(selected?.id ?? "");
  const pins: FeedbackItem[] = feedbackData?.data ?? [];

  const handlePlacePin = async (x: number, y: number) => {
    if (!selected) return;
    try {
      await createFeedback.mutateAsync({
        body: `Feedback point #${pins.length + 1}`,
        annotationJson: { xPos: x, yPos: y, pinNumber: pins.length + 1 },
      });
      setPlacingPin(false);
      setShowFeedback(true);
      toast("success", "Pin placed");
    } catch {
      toast("error", "Failed to place pin");
    }
  };

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 16rem)" }}>
      {/* List */}
      <div className="w-72 shrink-0 overflow-y-auto">
        <DeliverableList
          projectId={projectId}
          onSelect={(d) => {
            setSelected(d);
            setShowFeedback(false);
          }}
          selectedId={selected?.id}
        />
      </div>

      {/* Viewer area */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <RevisionCounter
                current={selected.revisionRound}
                limit={selected.maxRevisions}
                className="w-44"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setPlacingPin(!placingPin)}
                  className={placingPin ? "bg-primary/20 text-primary" : ""}
                >
                  <MapPin className="mr-1.5 h-3.5 w-3.5" />
                  {placingPin ? "Cancel" : "Pin"}
                </Button>
                <Button size="sm" onClick={() => setShowFeedback(!showFeedback)}>
                  Feedback ({pins.length})
                </Button>
                <Button size="sm" onClick={() => setShowUploader(true)}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <DeliverableViewer
                fileUrl={selected.fileUrl ?? ""}
                fileType={selected.mimeType}
                pins={pins}
                onPinClick={(pin) => {
                  setActivePinId(pin.id);
                  setShowFeedback(true);
                }}
                onPlacePin={handlePlacePin}
                placingPin={placingPin}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-[rgb(var(--border-default))]">
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Select a deliverable to view
            </p>
          </div>
        )}
      </div>

      {/* Feedback Panel */}
      {showFeedback && selected && (
        <FeedbackPanel
          deliverableId={selected.id}
          pins={pins}
          activePinId={activePinId}
          onClose={() => {
            setShowFeedback(false);
            setActivePinId(null);
          }}
          createMutation={createFeedback}
          resolveMutation={resolveFeedback}
        />
      )}

      {/* Upload Modal */}
      {selected && (
        <DeliverableUploader
          deliverableId={selected.id}
          projectId={projectId}
          open={showUploader}
          onClose={() => setShowUploader(false)}
          onComplete={() => setShowUploader(false)}
        />
      )}
    </div>
  );
}

function PortalLinkBadge({ portalToken }: { portalToken?: string }) {
  const [copied, setCopied] = useState(false);

  if (!portalToken) return null;

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${portalToken}`;

  const handleCopy = () => {
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ml-9 mt-3 flex items-center gap-2 rounded-lg border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] px-3 py-2">
      <span className="text-xs font-medium text-[rgb(var(--text-muted))]">Portal link:</span>
      <code className="flex-1 truncate text-xs text-[rgb(var(--text-secondary))]">{url}</code>
      <button
        onClick={handleCopy}
        title="Copy portal link"
        className="rounded p-1 hover:bg-[rgb(var(--border-default))]"
      >
        {copied
          ? <Check className="h-3.5 w-3.5 text-green-500" />
          : <Copy className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]" />}
      </button>
      <a href={url} target="_blank" rel="noopener noreferrer" title="Open portal">
        <button className="rounded p-1 hover:bg-[rgb(var(--border-default))]">
          <ExternalLink className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]" />
        </button>
      </a>
    </div>
  );
}

import { ScopeGuardTab } from "@/components/scope/ScopeGuardTab";
import { ChangeOrdersTab } from "@/components/scope/ChangeOrdersTab";
import { ActivityLogTab } from "@/components/shared/ActivityLogTab";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading } = useProject(id);
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const project = data?.data;
  if (!project) {
    return (
      <Card className="py-12 text-center">
        <p className="text-[rgb(var(--text-muted))]">Project not found.</p>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/projects")}
            className="rounded-md p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">{project.name}</h1>
          <Badge status={project.status}>{project.status}</Badge>
        </div>
        <div className="ml-9 mt-2 flex flex-wrap items-center gap-4 text-sm text-[rgb(var(--text-muted))]">
          {project.description && (
            <p className="text-[rgb(var(--text-secondary))]">{project.description}</p>
          )}
          {project.client?.name && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {project.client.name}
            </span>
          )}
          {project.budget != null && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              ${project.budget.toLocaleString()}
            </span>
          )}
        </div>
        <PortalLinkBadge portalToken={project.portalToken} />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-[rgb(var(--border-default))]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === tab.key
                ? "text-primary"
                : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]",
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "brief" && <BriefTab projectId={id} />}
        {activeTab === "deliverables" && <DeliverablesTab projectId={id} />}
        {activeTab === "scope-guard" && <ScopeGuardTab projectId={id} />}
        {activeTab === "change-orders" && <ChangeOrdersTab projectId={id} />}
        {activeTab === "health" && <HealthTab projectId={id} />}
        {activeTab === "log" && (
          <ActivityLogTab workspaceId={project.workspaceId} />
        )}
      </div>
    </div>
  );
}
