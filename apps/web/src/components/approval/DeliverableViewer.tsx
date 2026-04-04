"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { Button } from "@novabots/ui";
import { AnnotationCanvas } from "./AnnotationCanvas";
import type { FeedbackItem } from "@/hooks/useFeedback";

interface DeliverableViewerProps {
  fileUrl: string;
  fileType?: string | null;
  externalUrl?: string | null;
  pins: FeedbackItem[];
  onPinClick: (pin: FeedbackItem) => void;
  onPlacePin: (x: number, y: number) => void;
  placingPin: boolean;
}

export function DeliverableViewer({
  fileUrl,
  fileType,
  externalUrl,
  pins,
  onPinClick,
  onPlacePin,
  placingPin,
}: DeliverableViewerProps) {
  const [zoom, setZoom] = useState(1);

  const isImage = fileType?.startsWith("image/");
  const isPdf = fileType === "application/pdf";
  const isFigma = externalUrl?.includes("figma.com");

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleReset = () => setZoom(1);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--border-default))] bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="rounded p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-xs text-[rgb(var(--text-secondary))]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="rounded p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="rounded p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        {placingPin && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Click anywhere to place a pin
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-auto p-4">
        <div
          className="relative mx-auto inline-block origin-top-left transition-transform"
          style={{ transform: `scale(${zoom})` }}
        >
          {isFigma && externalUrl ? (
            <iframe
              src={`${externalUrl}&embed=1`}
              className="h-[600px] w-[800px] rounded-lg border-0"
              allowFullScreen
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              className="h-[800px] w-[600px] rounded-lg border-0 bg-white"
            />
          ) : isImage ? (
            <div className="relative">
              <img
                src={fileUrl}
                alt="Deliverable"
                className="max-w-full rounded-lg"
                draggable={false}
              />
              <AnnotationCanvas
                pins={pins}
                onPinClick={onPinClick}
                onPlacePin={onPlacePin}
                placingPin={placingPin}
              />
            </div>
          ) : (
            <div className="flex h-64 w-96 items-center justify-center rounded-lg bg-white">
              <p className="text-sm text-[rgb(var(--text-muted))]">Preview not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
