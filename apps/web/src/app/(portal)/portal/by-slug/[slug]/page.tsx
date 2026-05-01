import { redirect, notFound } from "next/navigation";

/**
 * FR-AP-001: Portal by-slug page
 *
 * This page is reached via the Next.js middleware subdomain rewrite:
 *   {slug}.scopeiq.com  →  /portal/by-slug/{slug}
 *
 * It resolves the workspace slug to a project portal token by calling
 * GET /v1/workspaces/by-slug/:slug on the API, then redirects the client
 * to the canonical /portal/[portalToken] route.
 *
 * This page is intentionally server-rendered with no caching so stale
 * portal tokens are never served.
 */

export const dynamic = "force-dynamic";

interface BySlugPageProps {
    params: { slug: string };
    searchParams?: Record<string, string | string[] | undefined>;
}

async function resolveSlug(slug: string): Promise<{ portalToken: string } | null> {
    const apiUrl = process.env.API_URL ?? "http://localhost:4000";
    try {
        const res = await fetch(`${apiUrl}/v1/workspaces/by-slug/${encodeURIComponent(slug)}`, {
            // No auth header — this endpoint is intentionally public (FR-AP-001)
            cache: "no-store",
        });

        if (!res.ok) return null;

        const json = await res.json() as { data?: { portalToken?: string } };
        const token = json?.data?.portalToken;
        return token ? { portalToken: token } : null;
    } catch {
        return null;
    }
}

export default async function PortalBySlugPage({ params }: BySlugPageProps) {
    const { slug } = params;

    const result = await resolveSlug(slug);

    if (!result) {
        // Render a friendly 404 rather than a raw Next.js error page
        notFound();
    }

    // Redirect to the canonical portal token URL
    redirect(`/portal/${result.portalToken}`);
}
