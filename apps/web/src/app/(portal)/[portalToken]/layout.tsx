import type { ReactNode } from "react";
import { generatePortalTheme } from "@/lib/portal-theme";
import { getPortalProject } from "@/lib/portal-auth";

interface PortalTokenLayoutProps {
  children: ReactNode;
  params: Promise<{ portalToken: string }>;
}

const DEFAULT_BRAND_COLOR = "#0F6E56";

async function fetchWorkspaceBranding(token: string) {
  try {
    const projectData = await getPortalProject(token);
    return projectData?.workspace ?? null;
  } catch {
    return null;
  }
}

function generatePortalCSSVars(brandColor: string): string {
  const theme = generatePortalTheme(brandColor);
  return Object.entries(theme)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n      ");
}

/**
 * Server Component that injects workspace branding as CSS variables.
 * Eliminates flash of unstyled content by applying theme on first paint.
 */
export default async function PortalTokenLayout({
  children,
  params,
}: PortalTokenLayoutProps) {
  const { portalToken } = await params;
  const workspace = await fetchWorkspaceBranding(portalToken);
  const brandColor = workspace?.brandColor ?? DEFAULT_BRAND_COLOR;
  const cssVars = generatePortalCSSVars(brandColor);

  return (
    <>
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for server-side CSS variable injection
        dangerouslySetInnerHTML={{
          __html: `:root {\n      ${cssVars}\n    }`,
        }}
      />
      {children}
    </>
  );
}
