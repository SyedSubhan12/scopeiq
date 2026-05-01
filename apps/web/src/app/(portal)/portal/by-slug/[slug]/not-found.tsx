"use client";

/**
 * FR-AP-001: 404 page shown when a workspace slug cannot be resolved.
 * Shown when: the slug does not exist, or the workspace has no active project
 * with a portal token.
 */
export default function PortalNotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--surface-subtle,248_249_250))] p-4">
            <div className="w-full max-w-md rounded-2xl border border-[rgb(var(--border-default,226_228_232))] bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                </div>

                <h1 className="text-xl font-bold text-slate-900">Portal not found</h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    This portal link does not exist or has expired. Please contact your agency for
                    a valid link.
                </p>
            </div>
        </div>
    );
}
