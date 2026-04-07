"use client";

import { useState, useEffect } from "react";
import { Save, Building, Upload, X } from "lucide-react";
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
import { useWorkspace, useUpdateWorkspace } from "@/hooks/useWorkspace";

export default function WorkspaceSettingsPage() {
  const { data, isLoading } = useWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const { toast } = useToast();

  const workspace = data?.data;

  const [wsName, setWsName] = useState("");
  const [brandColor, setBrandColor] = useState("#0F6E56");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (workspace) {
      setWsName(workspace.name ?? "");
      setBrandColor(workspace.brandColor ?? "#0F6E56");
      setLogoUrl(workspace.logoUrl ?? "");
      setLogoPreview(workspace.logoUrl ?? null);
    }
  }, [workspace]);

  const handleSaveWorkspace = async () => {
    if (!wsName.trim()) {
      toast("error", "Workspace name is required");
      return;
    }
    try {
      await updateWorkspace.mutateAsync({
        name: wsName.trim(),
        brandColor,
        ...(logoUrl ? { logoUrl } : {}),
      });
      toast("success", "Workspace updated successfully");
    } catch {
      toast("error", "Failed to update workspace");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("error", "Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast("error", "Image must be less than 2MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLogoPreview(result);
      setLogoUrl(result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast("error", "Failed to read image file");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    setLogoPreview(null);
  };

  const presetColors = [
    "#0F6E56",
    "#2563EB",
    "#7C3AED",
    "#DB2777",
    "#DC2626",
    "#EA580C",
    "#D97706",
    "#059669",
    "#0891B2",
    "#4F46E5",
  ];

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[rgb(var(--surface-subtle))]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[rgb(var(--surface-subtle))]" />
        </div>
        <div className="h-64 w-full animate-pulse rounded-xl bg-[rgb(var(--surface-subtle))]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-[rgb(var(--text-muted))]" />
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            Workspace
          </h1>
        </div>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Manage your workspace name, branding, and appearance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Workspace Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Workspace Name
              </label>
              <Input
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="Enter workspace name"
                maxLength={100}
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Workspace Logo
              </label>
              <div className="flex items-start gap-4">
                {logoPreview ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-[rgb(var(--border-default))]">
                    <img
                      src={logoPreview}
                      alt="Workspace logo"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[rgb(var(--text-muted))] shadow-sm ring-1 ring-[rgb(var(--border-default))] hover:text-red-500"
                      aria-label="Remove logo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))]">
                    <Upload className="h-5 w-5 text-[rgb(var(--text-muted))]" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm font-medium text-[rgb(var(--text-primary))] transition-colors hover:bg-[rgb(var(--surface-subtle))]">
                    <Upload className="h-4 w-4" />
                    {logoPreview ? "Change logo" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="sr-only"
                      disabled={isUploading}
                    />
                  </label>
                  {isUploading && (
                    <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                      Processing image...
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                    PNG, JPG or SVG. Max 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Color */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                Brand Color
              </label>
              <div className="space-y-3">
                {/* Preset colors */}
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
                      aria-label={`Select brand color ${color}`}
                    />
                  ))}
                </div>

                {/* Custom color picker */}
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-[rgb(var(--border-default))]"
                    aria-label="Custom brand color"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                        setBrandColor(v);
                      }
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
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
                Preview
              </p>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt=""
                    className="h-8 w-8 rounded-md object-cover"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    {(wsName || "W").charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className="text-sm font-semibold"
                  style={{ color: brandColor }}
                >
                  {wsName || "Workspace"}
                </span>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={() => void handleSaveWorkspace()}
                disabled={updateWorkspace.isPending || !wsName.trim()}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {updateWorkspace.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
