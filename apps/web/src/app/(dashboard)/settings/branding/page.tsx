"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  useToast,
  cn,
} from "@novabots/ui";
import {
  Upload,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Globe,
  Eye,
  EyeOff,
} from "lucide-react";
import { useWorkspace, useUpdateWorkspace } from "@/hooks/useWorkspace";
import { useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DomainStatus = "pending" | "verified" | "failed" | null;

interface CustomDomainData {
  customDomain: string | null;
  domainVerificationStatus: DomainStatus;
  domainVerifiedAt: string | null;
  cfStatus: string | null;
  cnameRecord: { host: string; pointsTo: string; type: string } | null;
}

interface AddDomainResponse {
  data: {
    domain: string;
    cfHostnameId: string | null;
    status: string;
    dnsRecord: { recordType: string; host: string; value: string; ttlSeconds: number };
    cnameRecord: { host: string; pointsTo: string; type: string };
  };
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function DomainStatusBadge({ status }: { status: DomainStatus }) {
  if (!status) return null;

  const config = {
    verified: {
      icon: CheckCircle2,
      label: "Verified",
      className: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    pending: {
      icon: Clock,
      label: "Pending DNS",
      className: "text-amber-600 bg-amber-50 border-amber-200",
    },
    failed: {
      icon: AlertCircle,
      label: "Verification failed",
      className: "text-red-600 bg-red-50 border-red-200",
    },
  } as const;

  const c = config[status];
  const Icon = c.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        c.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const LOGO_MAX_BYTES = 2 * 1024 * 1024;

const presetColors = [
  "#0F6E56",
  "#1D9E75",
  "#2563EB",
  "#7C3AED",
  "#DC2626",
  "#EA580C",
  "#0891B2",
  "#475569",
];

export default function BrandingSettingsPage() {
  const { data, isLoading } = useWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const workspace = data?.data;
  const isPaidPlan = workspace?.plan === "studio" || workspace?.plan === "agency";

  // --- Logo state ---
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Color state ---
  const [brandColor, setBrandColor] = useState("#0F6E56");
  const [secondaryColor, setSecondaryColor] = useState("#1D9E75");
  const [isSavingColors, setIsSavingColors] = useState(false);

  // --- Hide branding toggle ---
  const [hideBranding, setHideBranding] = useState(false);
  const [isSavingHide, setIsSavingHide] = useState(false);

  // --- Custom domain state ---
  const [domainInput, setDomainInput] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [domainData, setDomainData] = useState<CustomDomainData | null>(null);
  const [pendingDnsRecord, setPendingDnsRecord] = useState<AddDomainResponse["data"]["dnsRecord"] | null>(null);
  const [isRemovingDomain, setIsRemovingDomain] = useState(false);

  // Populate from workspace
  useEffect(() => {
    if (workspace) {
      setBrandColor(workspace.brandColor ?? "#0F6E56");
      setSecondaryColor(workspace.secondaryColor ?? "#1D9E75");
      setLogoPreview(workspace.logoUrl ?? null);
      const settings = (workspace.settingsJson ?? {}) as Record<string, unknown>;
      setHideBranding(!!settings["hideScopeiqBranding"]);
    }
  }, [workspace]);

  // Fetch domain status
  const fetchDomainStatus = useCallback(async () => {
    try {
      const res = (await fetchWithAuth("/v1/custom-domain")) as {
        data: CustomDomainData;
      };
      setDomainData(res.data);
    } catch {
      // Non-fatal — workspace may not have a domain yet
    }
  }, []);

  useEffect(() => {
    void fetchDomainStatus();
  }, [fetchDomainStatus]);

  // --- Logo handlers ---
  const processFile = async (file: File) => {
    if (file.size > LOGO_MAX_BYTES) {
      toast("error", `Logo must be under 2 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB)`);
      return;
    }

    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"]);
    if (!allowed.has(file.type)) {
      toast("error", "Only JPEG, PNG, WebP, SVG, and GIF images are accepted");
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: get presigned URL
      const urlRes = (await fetchWithAuth("/v1/branding/logo/upload-url", {
        method: "POST",
        body: JSON.stringify({ contentType: file.type, fileSizeBytes: file.size }),
      })) as { data: { uploadUrl: string; objectKey: string; publicUrl: string } };

      const { uploadUrl, objectKey, publicUrl } = urlRes.data;

      // Step 2: PUT directly to R2/MinIO
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }

      // Step 3: confirm
      await fetchWithAuth("/v1/branding/logo/confirm", {
        method: "POST",
        body: JSON.stringify({ objectKey, publicUrl }),
      });

      setLogoPreview(publicUrl);
      void queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast("success", "Logo updated");
    } catch (err) {
      toast("error", (err as Error).message || "Logo upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  // --- Color save ---
  const handleSaveColors = async () => {
    setIsSavingColors(true);
    try {
      await fetchWithAuth("/v1/branding", {
        method: "PATCH",
        body: JSON.stringify({ brandColor, secondaryColor }),
      });
      await updateWorkspace.mutateAsync({ brandColor });
      toast("success", "Brand colors saved");
    } catch {
      toast("error", "Failed to save colors");
    } finally {
      setIsSavingColors(false);
    }
  };

  // --- Hide branding toggle ---
  const handleToggleHideBranding = async () => {
    if (!isPaidPlan) {
      toast("error", "Hiding ScopeIQ branding requires the Studio or Agency plan");
      return;
    }
    setIsSavingHide(true);
    try {
      await fetchWithAuth("/v1/branding", {
        method: "PATCH",
        body: JSON.stringify({ hideScopeiqBranding: !hideBranding }),
      });
      setHideBranding((v) => !v);
      void queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast("success", `ScopeIQ branding ${hideBranding ? "shown" : "hidden"}`);
    } catch {
      toast("error", "Failed to update branding visibility");
    } finally {
      setIsSavingHide(false);
    }
  };

  // --- Custom domain handlers ---
  const handleAddDomain = async () => {
    const domain = domainInput.trim().toLowerCase();
    if (!domain) return;

    setIsAddingDomain(true);
    try {
      const res = (await fetchWithAuth("/v1/custom-domain", {
        method: "POST",
        body: JSON.stringify({ domain }),
      })) as AddDomainResponse;

      setPendingDnsRecord(res.data.dnsRecord);
      setDomainData({
        customDomain: res.data.domain,
        domainVerificationStatus: "pending",
        domainVerifiedAt: null,
        cfStatus: null,
        cnameRecord: res.data.cnameRecord,
      });
      setDomainInput("");
      toast("success", "Domain added — follow DNS instructions below");
    } catch (err) {
      toast("error", (err as Error).message || "Failed to add domain");
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    setIsRemovingDomain(true);
    try {
      await fetchWithAuth("/v1/custom-domain/local", { method: "DELETE" });
      setDomainData(null);
      setPendingDnsRecord(null);
      toast("success", "Custom domain removed");
    } catch {
      toast("error", "Failed to remove domain");
    } finally {
      setIsRemovingDomain(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent opacity-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div>
        <h1 className="text-xl font-semibold">Branding</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Customize how your portal looks to clients.
        </p>
      </div>

      {/* --- Logo --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag-drop zone */}
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-[rgb(var(--border-subtle))] hover:border-[rgb(var(--border-default))]",
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            aria-label="Upload logo"
          >
            {isUploading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent opacity-50" />
            ) : logoPreview ? (
              <img
                src={logoPreview}
                alt="Workspace logo"
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <Upload className="h-8 w-8 text-[rgb(var(--text-muted))]" />
            )}
            <p className="mt-3 text-sm text-[rgb(var(--text-muted))]">
              {logoPreview ? "Click or drag to replace" : "Drop an image or click to upload"}
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              JPEG, PNG, WebP, SVG, GIF — max 2 MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
            onChange={handleFileChange}
          />

          {logoPreview && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={async () => {
                try {
                  await updateWorkspace.mutateAsync({ logoUrl: "" });
                  setLogoPreview(null);
                  toast("success", "Logo removed");
                } catch {
                  toast("error", "Failed to remove logo");
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
              Remove logo
            </Button>
          )}
        </CardContent>
      </Card>

      {/* --- Brand colors --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary color */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Primary color</label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBrandColor(color)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                    brandColor === color
                      ? "border-[rgb(var(--text-primary))] ring-2 ring-primary/20"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-[rgb(var(--border-default))]"
                aria-label="Custom primary color"
              />
              <Input
                value={brandColor}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setBrandColor(v);
                }}
                className="w-32"
                placeholder="#0F6E56"
                maxLength={7}
              />
              <div
                className="h-10 flex-1 rounded-lg border border-[rgb(var(--border-subtle))]"
                style={{ backgroundColor: brandColor }}
                aria-hidden
              />
            </div>
          </div>

          {/* Secondary color */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Secondary color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-[rgb(var(--border-default))]"
                aria-label="Custom secondary color"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setSecondaryColor(v);
                }}
                className="w-32"
                placeholder="#1D9E75"
                maxLength={7}
              />
              <div
                className="h-10 flex-1 rounded-lg border border-[rgb(var(--border-subtle))]"
                style={{ backgroundColor: secondaryColor }}
                aria-hidden
              />
            </div>
          </div>

          {/* CSS var preview */}
          <div className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
              Portal preview
            </p>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <img src={logoPreview} alt="" className="h-8 w-8 rounded-md object-cover" />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {(workspace?.name || "W").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold" style={{ color: brandColor }}>
                  {workspace?.name || "Your Workspace"}
                </p>
                <p className="text-xs" style={{ color: secondaryColor }}>
                  portal.scopeiq.app
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => void handleSaveColors()} disabled={isSavingColors}>
              {isSavingColors ? "Saving..." : "Save colors"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Hide ScopeIQ branding --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">White-label</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Hide ScopeIQ branding</p>
              <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                Remove the "Powered by ScopeIQ" footer from client portals.
                {!isPaidPlan && (
                  <span className="ml-1 font-medium text-amber-600">
                    Requires Studio or Agency plan.
                  </span>
                )}
              </p>
            </div>
            <Button
              variant={hideBranding ? "primary" : "secondary"}
              size="sm"
              onClick={() => void handleToggleHideBranding()}
              disabled={isSavingHide || !isPaidPlan}
              className="shrink-0 gap-1.5"
              data-testid="hide-branding-toggle"
            >
              {hideBranding ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Branding hidden
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Show branding
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Custom domain --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Custom Domain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {domainData?.customDomain ? (
            <>
              {/* Current domain */}
              <div className="flex items-center justify-between rounded-lg border border-[rgb(var(--border-subtle))] p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{domainData.customDomain}</p>
                  <div className="mt-1">
                    <DomainStatusBadge status={domainData.domainVerificationStatus} />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => void handleRemoveDomain()}
                  disabled={isRemovingDomain}
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>

              {/* CNAME instruction */}
              {domainData.cnameRecord && (
                <div className="rounded-lg bg-[rgb(var(--surface-subtle))] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
                    Step 1 — Add CNAME record
                  </p>
                  <p className="mb-3 text-xs text-[rgb(var(--text-muted))]">
                    Point your domain to the ScopeIQ portal edge by adding this DNS record:
                  </p>
                  <DnsRecordRow
                    type="CNAME"
                    host={domainData.cnameRecord.host}
                    value={domainData.cnameRecord.pointsTo}
                  />
                </div>
              )}

              {/* TXT verification instruction */}
              {pendingDnsRecord && (
                <div className="rounded-lg bg-[rgb(var(--surface-subtle))] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
                    Step 2 — Add TXT verification record
                  </p>
                  <p className="mb-3 text-xs text-[rgb(var(--text-muted))]">
                    Proves domain ownership. TTL: {pendingDnsRecord.ttlSeconds}s.
                  </p>
                  <DnsRecordRow
                    type={pendingDnsRecord.recordType}
                    host={pendingDnsRecord.host}
                    value={pendingDnsRecord.value}
                  />
                </div>
              )}

              {domainData.domainVerificationStatus === "failed" && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  Verification failed — DNS records not found. Double-check your DNS settings and
                  the system will retry automatically (up to 24 h).
                </div>
              )}

              {domainData.domainVerificationStatus === "verified" && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  Your custom domain is live. Clients can access portals at{" "}
                  <strong>{domainData.customDomain}</strong>.
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-[rgb(var(--text-muted))]">
                Point a custom domain (e.g. <code className="font-mono text-xs">portal.yourcompany.com</code>) to
                your ScopeIQ portal.
              </p>
              <div className="flex gap-2">
                <Input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="portal.yourcompany.com"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleAddDomain();
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => void handleAddDomain()}
                  disabled={isAddingDomain || !domainInput.trim()}
                >
                  {isAddingDomain ? "Adding..." : "Add domain"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DNS record display helper
// ---------------------------------------------------------------------------

function DnsRecordRow({
  type,
  host,
  value,
}: {
  type: string;
  host: string;
  value: string;
}) {
  const { toast } = useToast();

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => toast("success", "Copied to clipboard"));
  };

  return (
    <div className="space-y-1 font-mono text-xs">
      <div className="grid grid-cols-[60px_1fr] gap-2">
        <span className="font-semibold text-[rgb(var(--text-muted))]">Type</span>
        <span>{type}</span>
        <span className="font-semibold text-[rgb(var(--text-muted))]">Host</span>
        <button
          type="button"
          className="truncate text-left underline decoration-dotted underline-offset-2 hover:text-[rgb(var(--text-primary))]"
          onClick={() => copy(host)}
        >
          {host}
        </button>
        <span className="font-semibold text-[rgb(var(--text-muted))]">Value</span>
        <button
          type="button"
          className="break-all text-left underline decoration-dotted underline-offset-2 hover:text-[rgb(var(--text-primary))]"
          onClick={() => copy(value)}
        >
          {value}
        </button>
      </div>
      <p className="text-[10px] text-[rgb(var(--text-muted))]">Click any value to copy.</p>
    </div>
  );
}
