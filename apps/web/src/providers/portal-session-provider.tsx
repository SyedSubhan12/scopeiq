"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Deliverable {
    id: string;
    name: string;
    status: string;
    revisionCount: number;
    maxRevisions: number;
    fileUrl: string | null;
    mimeType: string | null;
    externalUrl: string | null;
    type: string;
}

interface PortalSession {
    token: string;
    project: {
        id: string;
        name: string;
        description: string | null;
        status: string;
        clientName: string | null;
    };
    workspace: {
        id: string;
        name: string;
        logoUrl: string | null;
        brandColor: string;
    };
    deliverables: Deliverable[];
    loading: boolean;
    error: string | null;
}

const defaultSession: PortalSession = {
    token: "",
    project: { id: "", name: "", description: null, status: "", clientName: null },
    workspace: { id: "", name: "", logoUrl: null, brandColor: "#0F6E56" },
    deliverables: [],
    loading: true,
    error: null,
};

const PortalSessionContext = createContext<PortalSession>(defaultSession);

export function PortalSessionProvider({
    portalToken,
    children,
}: {
    portalToken: string;
    children: ReactNode;
}) {
    const [session, setSession] = useState<PortalSession>({
        ...defaultSession,
        token: portalToken,
    });

    useEffect(() => {
        if (!portalToken) {
            setSession((s) => ({ ...s, loading: false, error: "No portal token provided" }));
            return;
        }

        // Store token in localStorage for subsequent requests
        localStorage.setItem("portal_token", portalToken);

        const fetchSession = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/portal/session`, {
                    headers: { "X-Portal-Token": portalToken },
                });

                if (!res.ok) {
                    throw new Error(res.status === 401 ? "Invalid or expired portal link" : "Failed to load portal");
                }

                const { data } = await res.json();
                setSession({
                    token: portalToken,
                    project: data.project,
                    workspace: data.workspace,
                    deliverables: data.deliverables,
                    loading: false,
                    error: null,
                });
            } catch (err) {
                setSession((s) => ({
                    ...s,
                    loading: false,
                    error: err instanceof Error ? err.message : "Something went wrong",
                }));
            }
        };

        void fetchSession();
    }, [portalToken]);

    return (
        <PortalSessionContext.Provider value={session}>
            {children}
        </PortalSessionContext.Provider>
    );
}

export { PortalSessionContext };
