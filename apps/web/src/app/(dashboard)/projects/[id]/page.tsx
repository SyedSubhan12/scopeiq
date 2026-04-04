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
import { useFeedback, useCreateFeedback, type FeedbackItem } from "@/hooks/useFeedback";
import { Button, useToast } from "@novabots/ui";
import { MapPin, Upload } from "lucide-react";

const tabs = [
  { key: "brief", label: "Briefs" },
  { key: "deliverables", label: "Deliverables" },
  { key: "scope-guard", label: "Scope Guard" },
  { key: "change-orders", label: "Change Orders" },
  { key: "log", label: "Activity Log" },
];

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
  const pins: FeedbackItem[] = feedbackData?.data ?? [];

  const handlePlacePin = async (x: number, y: number) => {
    if (!selected) return;
    try {
      await createFeedback.mutateAsync({
        x_pos: x,
        y_pos: y,
        content: `Feedback point #${pins.length + 1}`,
        author_type: "agency",
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
                current={selected.revision_round}
                limit={selected.revision_limit}
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
                fileUrl={selected.file_url ?? ""}
                fileType={selected.file_type}
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
              "px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-b-2 border-primary text-primary"
                : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "brief" && <BriefTab projectId={id} />}
      {activeTab === "deliverables" && <DeliverablesTab projectId={id} />}
      {activeTab !== "brief" && activeTab !== "deliverables" && (
        <Card className="py-12 text-center">
          <p className="text-[rgb(var(--text-muted))]">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("-", " ")} will be available in upcoming phases.
          </p>
        </Card>
      )}
    </div>
  );
}
