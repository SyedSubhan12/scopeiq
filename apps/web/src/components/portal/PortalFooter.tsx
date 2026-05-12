"use client";

import React from "react";
import { cn } from "@novabots/ui";

interface PortalFooterProps {
  workspaceName?: string;
  brandColor?: string;
  className?: string;
}

export function PortalFooter({
  workspaceName,
  brandColor = "#0F6E56",
  className,
}: PortalFooterProps) {
  return (
    <footer className={cn("mt-auto py-8 px-6 text-center", className)}>
      <div className="max-w-4xl mx-auto">
        <p 
          className="text-sm font-bold uppercase tracking-[0.2em] mb-3"
          style={{ color: brandColor }}
        >
          Bill what you built.
        </p>
        <p className="text-xs text-[rgb(var(--text-muted))]">
          &copy; {new Date().getFullYear()} {workspaceName || "ScopeIQ"}. 
          Powered by <span className="font-semibold" style={{ color: brandColor }}>ScopeIQ</span>
        </p>
      </div>
    </footer>
  );
}
