"use client";

import { useState } from "react";
import {
  ZoomIn, ZoomOut, RotateCcw, ExternalLink, Download,
  FileText, Video, Link2, Figma, ImageIcon, FileArchive,
  FileSpreadsheet, Presentation,
} from "lucide-react";
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

// Extract YouTube video ID from various URL formats
function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return match?.[1] ?? null;
}

// Extract Loom video ID
function getLoomId(url: string): string | null {
  const match = url.match(/loom\.com\/share\/([a-f0-9]+)/i);
  return match?.[1] ?? null;
}

// Build Figma embed URL from share link
function getFigmaEmbedUrl(url: string): string {
  const encoded = encodeURIComponent(url);
  return `https://www.figma.com/embed?embed_host=share&url=${encoded}`;
}

// Determine if a file URL is a Google-Docs-viewable office format
function isOfficeDoc(mimeType?: string | null): boolean {
  if (!mimeType) return false;
  return [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ].includes(mimeType);
}

function fileDisplayName(mimeType?: string | null): string {
  if (!mimeType) return "File";
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType === "application/pdf") return "PDF Document";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType === "application/zip" || mimeType === "application/x-zip-compressed") return "ZIP Archive";
  if (mimeType.includes("word")) return "Word Document";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "Spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "Presentation";
  return "File";
}

function fileIcon(mimeType?: string | null) {
  if (!mimeType) return FileText;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return Presentation;
  if (mimeType === "application/zip" || mimeType === "application/x-zip-compressed") return FileArchive;
  return FileText;
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
  const isVideo = fileType?.startsWith("video/");
  const isOffice = isOfficeDoc(fileType);
  const isFigma = externalUrl?.includes("figma.com");
  const youtubeId = externalUrl ? getYouTubeId(externalUrl) : null;
  const loomId = externalUrl ? getLoomId(externalUrl) : null;
  const hasFile = !!fileUrl;
  const hasExternalUrl = !!externalUrl;

  // Zoom only applies to image + PDF views
  const showZoomControls = isImage || isPdf;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--border-default))] bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          {showZoomControls && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
                className="rounded p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-[3rem] text-center text-xs text-[rgb(var(--text-secondary))]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                className="rounded p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="rounded p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
                title="Reset zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {placingPin && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Click anywhere to place a feedback pin
            </span>
          )}
          {(hasFile || hasExternalUrl) && (
            <a
              href={externalUrl || fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-secondary))]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          )}
          {hasFile && (
            <a
              href={fileUrl}
              download
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-secondary))]"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-auto">
        {/* === IMAGE === */}
        {isImage && hasFile && (
          <div className="flex items-start justify-center overflow-auto p-4">
            <div
              className="relative inline-block origin-top transition-transform"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                src={fileUrl}
                alt="Deliverable"
                className="max-w-full rounded-lg shadow-sm"
                draggable={false}
              />
              <AnnotationCanvas
                pins={pins}
                onPinClick={onPinClick}
                onPlacePin={onPlacePin}
                placingPin={placingPin}
              />
            </div>
          </div>
        )}

        {/* === PDF === */}
        {isPdf && hasFile && (
          <div
            className="h-full origin-top overflow-auto transition-transform"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            <iframe
              src={`${fileUrl}#toolbar=1`}
              className="h-[800px] w-full border-0"
              title="PDF Viewer"
            />
          </div>
        )}

        {/* === VIDEO (file upload) === */}
        {isVideo && hasFile && (
          <div className="flex h-full items-center justify-center bg-black p-4">
            <video
              src={fileUrl}
              controls
              className="max-h-full max-w-full rounded-lg"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* === OFFICE DOCS (Word, Excel, PPT) === */}
        {isOffice && hasFile && (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            className="h-full w-full border-0"
            title="Document Viewer"
          />
        )}

        {/* === FIGMA === */}
        {isFigma && hasExternalUrl && (
          <iframe
            src={getFigmaEmbedUrl(externalUrl!)}
            className="h-full w-full border-0"
            title="Figma Design"
            allowFullScreen
          />
        )}

        {/* === YOUTUBE === */}
        {youtubeId && (
          <div className="flex h-full items-center justify-center bg-black p-6">
            <div className="aspect-video w-full max-w-4xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                className="h-full w-full rounded-lg border-0"
                title="YouTube Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* === LOOM === */}
        {loomId && (
          <div className="flex h-full items-center justify-center bg-[rgb(var(--surface-subtle))] p-6">
            <div className="aspect-video w-full max-w-4xl">
              <iframe
                src={`https://www.loom.com/embed/${loomId}`}
                className="h-full w-full rounded-xl border-0 shadow-lg"
                title="Loom Video"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* === EXTERNAL LINK (generic) === */}
        {hasExternalUrl && !isFigma && !youtubeId && !loomId && (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--surface-subtle))]">
              <Link2 className="h-8 w-8 text-[rgb(var(--text-muted))]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">External Resource</p>
              <p className="mt-1 max-w-xs truncate text-xs text-[rgb(var(--text-muted))]">{externalUrl}</p>
            </div>
            <a
              href={externalUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" />
              Open Link
            </a>
          </div>
        )}

        {/* === UNSUPPORTED FILE TYPE === */}
        {hasFile && !isImage && !isPdf && !isVideo && !isOffice && (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
            {(() => {
              const Icon = fileIcon(fileType);
              return (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--surface-subtle))]">
                  <Icon className="h-8 w-8 text-[rgb(var(--text-muted))]" />
                </div>
              );
            })()}
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                {fileDisplayName(fileType)}
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                This file type can't be previewed in the browser.
              </p>
            </div>
            <a
              href={fileUrl}
              download
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Download File
            </a>
          </div>
        )}

        {/* === EMPTY STATE === */}
        {!hasFile && !hasExternalUrl && (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--surface-subtle))]">
              <FileText className="h-8 w-8 text-[rgb(var(--text-muted))]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">No file uploaded yet</p>
              <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">Use the Upload button to attach a file.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
