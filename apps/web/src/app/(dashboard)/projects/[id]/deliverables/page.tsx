"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Upload } from "lucide-react";
import { Button, useToast } from "@novabots/ui";
import { DeliverableList } from "@/components/approval/DeliverableList";
import { DeliverableViewer } from "@/components/approval/DeliverableViewer";
import { DeliverableUploader } from "@/components/approval/DeliverableUploader";
import { FeedbackPanel } from "@/components/approval/FeedbackPanel";
import { RevisionCounter } from "@/components/approval/RevisionCounter";
import { FeedbackSummary } from "@/components/approval/FeedbackSummary";
import { useDeliverables, type Deliverable } from "@/hooks/useDeliverables";
import { useFeedback, useCreateFeedback, type FeedbackItem } from "@/hooks/useFeedback";

export default function ProjectDeliverablesPage() {
  const params = useParams();
  const projectId = params.id as string;
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
    const pinNumber = pins.length + 1;
    try {
      await createFeedback.mutateAsync({
        x_pos: x,
        y_pos: y,
        pin_number: pinNumber,
        content: `Feedback point #${pinNumber}`,
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
    <div className="flex h-[calc(100vh-10rem)] gap-4">
      {/* Left: List */}
      <div className="w-80 shrink-0 overflow-y-auto">
        <DeliverableList
          projectId={projectId}
          onSelect={(d) => {
            setSelected(d);
            setShowFeedback(false);
          }}
          selectedId={selected?.id}
        />
      </div>

      {/* Center: Viewer */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {selected ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <RevisionCounter
                current={selected.revision_round}
                limit={selected.revision_limit}
                className="w-48"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setPlacingPin(!placingPin)}
                  className={placingPin ? "bg-primary/20 text-primary" : ""}
                >
                  <MapPin className="mr-1.5 h-3.5 w-3.5" />
                  {placingPin ? "Cancel Pin" : "Add Pin"}
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

            {/* Viewer */}
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

            {/* Feedback Summary */}
            <FeedbackSummary tasks={[]} isLoading={false} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-[rgb(var(--border-default))]">
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Select a deliverable to view
            </p>
          </div>
        )}
      </div>

      {/* Right: Feedback Panel */}
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
