"use client";

import React, { ReactNode, useState } from "react";
import { PortalHeader } from "./PortalHeader";
import { PortalTabs, type TabKey } from "./PortalTabs";
import { PortalFooter } from "./PortalFooter";
import { PoweredByBadge } from "./PoweredByBadge";

interface PortalShellProps {
  children: ReactNode;
  workspaceName: string;
  logoUrl: string | null;
  brandColor?: string;
  projectName: string;
  clientName: string | null;
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
  showBrief?: boolean;
  showReviewWork?: boolean;
  showMessages?: boolean;
  plan?: string;
  hideFooter?: boolean;
}

const DEFAULT_BRAND = "#0F6E56";

export function PortalShell({
  children,
  workspaceName,
  logoUrl,
  brandColor,
  projectName,
  clientName,
  activeTab,
  onTabChange,
  showBrief = true,
  showReviewWork = true,
  showMessages = true,
  plan = "free",
  hideFooter = false,
}: PortalShellProps) {
  const [internalTab, setInternalTab] = useState<TabKey>("brief");
  const tab = activeTab ?? internalTab;
  const handleChange = onTabChange ?? setInternalTab;
  const resolvedBrand = brandColor ?? DEFAULT_BRAND;

  return (
    <div className="flex min-h-screen flex-col bg-[rgb(var(--surface-subtle))]">
      <PortalHeader
        workspaceName={workspaceName}
        logoUrl={logoUrl}
        brandColor={resolvedBrand}
        projectName={projectName}
        clientName={clientName}
      />

      <div className="sticky top-0 z-30 border-b border-[rgb(var(--border-subtle))] bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4">
          <PortalTabs
            active={tab}
            onChange={handleChange}
            showBrief={showBrief}
            showReviewWork={showReviewWork}
            showMessages={showMessages}
            brandColor={resolvedBrand}
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-6">
        {children}
      </main>

      {!hideFooter && (
        <PortalFooter
          workspaceName={workspaceName}
          brandColor={resolvedBrand}
        />
      )}

      <PoweredByBadge plan={plan} />
    </div>
  );
}
