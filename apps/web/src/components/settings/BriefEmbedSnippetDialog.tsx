"use client";

import { useState } from "react";
import { Button, useToast } from "@novabots/ui";
import { Code2, Copy, ExternalLink, RefreshCw, Check } from "lucide-react";

interface BriefEmbed {
  id: string;
  token: string;
  isActive: boolean;
  formConfigJson: Record<string, unknown>;
  createdAt: string;
}

interface BriefEmbedSnippetDialogProps {
  embed: BriefEmbed;
  onClose: () => void;
}

const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://app.scopeiq.io";

export function BriefEmbedSnippetDialog({ embed, onClose }: BriefEmbedSnippetDialogProps) {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const iframeUrl = `${APP_URL}/embed/brief/${embed.token}`;
  const iframeSnippet = `<iframe\n  src="${iframeUrl}"\n  width="100%"\n  height="640"\n  style="border:none;border-radius:8px;"\n  loading="lazy"\n  title="Brief Intake Form"\n></iframe>`;
  const scriptSnippet = `<div id="scopeiq-embed-${embed.token.slice(0, 8)}"></div>\n<script\n  src="${APP_URL}/embed.js"\n  data-token="${embed.token}"\n  data-container="scopeiq-embed-${embed.token.slice(0, 8)}"\n  async\n></script>`;

  async function copyToClipboard(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast("success", "Copied to clipboard");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast("error", "Failed to copy");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal
      aria-label="Embed snippet"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--border-default))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
              Embed intake form
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[rgb(var(--text-muted))] hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Preview link */}
          <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-3">
            <p className="text-xs text-indigo-700 truncate mr-4">{iframeUrl}</p>
            <a
              href={iframeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Preview
            </a>
          </div>

          {/* Option 1: iframe */}
          <SnippetBlock
            label="Option 1 — iframe embed"
            description="Paste inside any HTML page. Recommended for most use cases."
            code={iframeSnippet}
            copied={copiedKey === "iframe"}
            onCopy={() => void copyToClipboard(iframeSnippet, "iframe")}
          />

          {/* Option 2: script */}
          <SnippetBlock
            label="Option 2 — JavaScript snippet"
            description="Loads the form into any div. Useful for React / SPA sites."
            code={scriptSnippet}
            copied={copiedKey === "script"}
            onCopy={() => void copyToClipboard(scriptSnippet, "script")}
          />

          {/* Token info */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <strong>Token:</strong> {embed.token.slice(0, 16)}…
            <span className="ml-2 text-amber-500">
              (Rotate the token in settings if this form is compromised)
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[rgb(var(--border-default))] px-6 py-4">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SnippetBlockProps {
  label: string;
  description: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
}

function SnippetBlock({ label, description, code, copied, onCopy }: SnippetBlockProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{label}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">{description}</p>
        </div>
        <button
          onClick={onCopy}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs leading-relaxed text-gray-100 whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

// Re-export a convenience hook/component for the settings page
export function BriefEmbedManager() {
  const [embeds, setEmbeds] = useState<BriefEmbed[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmbed, setSelectedEmbed] = useState<BriefEmbed | null>(null);
  const { toast } = useToast();

  // Lazy-load embed list when user opens the panel
  async function loadEmbeds() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/brief-embeds", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      const json = (await res.json()) as { data: BriefEmbed[] };
      setEmbeds(json.data);
    } catch {
      toast("error", "Failed to load embed forms");
    } finally {
      setLoading(false);
    }
  }

  async function rotateToken(id: string) {
    try {
      const res = await fetch(`/api/v1/brief-embeds/${id}/rotate-token`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to rotate token");
      const json = (await res.json()) as { data: BriefEmbed };
      setEmbeds((prev) => prev.map((e) => (e.id === id ? json.data : e)));
      if (selectedEmbed?.id === id) setSelectedEmbed(json.data);
      toast("success", "Token rotated");
    } catch {
      toast("error", "Failed to rotate token");
    }
  }

  return (
    <div className="rounded-xl border border-[rgb(var(--border-default))] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-[rgb(var(--text-muted))]" />
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            Embeddable intake forms
          </h3>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadEmbeds()}>
          {loading ? "Loading…" : "Load forms"}
        </Button>
      </div>

      {embeds.length === 0 && !loading && (
        <p className="text-xs text-[rgb(var(--text-muted))]">
          No embed forms yet. Create one via the API or contact your admin.
        </p>
      )}

      <ul className="space-y-2">
        {embeds.map((embed) => (
          <li
            key={embed.id}
            className="flex items-center justify-between rounded-lg border border-[rgb(var(--border-default))] px-4 py-3"
          >
            <div>
              <p className="text-xs font-mono text-gray-500">{embed.token.slice(0, 16)}…</p>
              <p className="text-xs text-[rgb(var(--text-muted))]">
                {embed.isActive ? "Active" : "Inactive"} &middot; Created{" "}
                {new Date(embed.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void rotateToken(embed.id)}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Rotate token"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedEmbed(embed)}
              >
                Get snippet
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {selectedEmbed && (
        <BriefEmbedSnippetDialog
          embed={selectedEmbed}
          onClose={() => setSelectedEmbed(null)}
        />
      )}
    </div>
  );
}
