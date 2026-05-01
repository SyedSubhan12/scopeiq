import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/auth/callback", "/forgot-password", "/reset-password"];
const portalPrefix = "/portal";

// Subdomains that are NOT agency portals — these are first-party hosts.
const RESERVED_SUBDOMAINS = new Set(["www", "app", "api"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------------------------------------------------------------------------
  // FR-AP-001: Subdomain routing — {slug}.scopeiq.com  →  /portal/by-slug/{slug}{path}
  // Runs before all auth checks so unauthenticated clients reach their portal.
  // ---------------------------------------------------------------------------
  const host = request.headers.get("host") ?? "";
  const subdomainMatch = /^([a-z0-9-]+)\.scopeiq\.com(?::\d+)?$/.exec(host);
  if (subdomainMatch) {
    const slug = subdomainMatch[1] ?? "";
    if (slug && !RESERVED_SUBDOMAINS.has(slug)) {
      const url = request.nextUrl.clone();
      url.pathname = `/portal/by-slug/${slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // 1. Root "/" — always public (marketing homepage)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 1b. Public static assets (e.g. Lottie JSON under public/lottie/)
  if (pathname.startsWith("/lottie/")) {
    return NextResponse.next();
  }

  // 2. Portal routes — always public (client access via token, no Supabase auth)
  if (pathname.startsWith(portalPrefix)) {
    return NextResponse.next();
  }

  // 3. Invite acceptance — always public (user may not have account yet)
  if (pathname.startsWith("/invite")) {
    return NextResponse.next();
  }

  // 4. Public auth paths — redirect to dashboard if already signed in
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    const hasSession = checkSession(request);
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 5. All other routes require Supabase session
  const hasSession = checkSession(request);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Onboarding-aware routing — use x-onboarded cookie for instant server-side redirect
  //    (cookie is set by workspace.store.ts after hydration)
  const isOnboarded = request.cookies.get("x-onboarded")?.value === "1";

  if (pathname.startsWith("/onboarding")) {
    // Already onboarded → skip back to dashboard
    if (isOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 7. Dashboard routes — redirect to onboarding if not onboarded yet
  //    Only enforce when we have the cookie (i.e., workspace has loaded at least once).
  //    On first load the cookie doesn't exist yet — auth-provider handles it client-side.
  const hasCookie = request.cookies.has("x-onboarded");
  if (hasCookie && !isOnboarded && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

function checkSession(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => {
    if (!cookie.name.startsWith("sb-")) return false;
    if (cookie.name.endsWith("-code-verifier")) return false;
    return (
      cookie.name === "sb-access-token" ||
      cookie.name === "sb-refresh-token" ||
      cookie.name.endsWith("-auth-token") ||
      cookie.name.includes("-auth-token.")
    );
  });
}

export const config = {
  // Exclude the entire `/_next/*` tree (not only static/image). Otherwise dev-only
  // routes like `/_next/webpack-hmr` run through auth and get redirected to /login,
  // which breaks HMR, corrupts chunk loading, and surfaces as 404s on navigations.
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
