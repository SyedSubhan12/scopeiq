"use client";

import { createContext, useEffect, useState, ReactNode } from "react";
import { setPortalToken } from "@/lib/portal-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Deliverable {
    id: string;
    name: string;
    status: string;
    revisionRound: number;
    maxRevisions: number;
    fileUrl: string | null;
    mimeType: string | null;
    externalUrl: string | null;
    type: string;
}

interface BriefField {
    id: string;
    key: string;
    label: string;
    type: string;
    placeholder?: string;
    description?: string;
    required: boolean;
    options?: string[];
    conditions?: {
        field_key: string;
        operator: "equals" | "not_equals" | "contains";
        value: string;
    }[];
    order: number;
    value: string | null;
    attachments: {
        id: string;
        originalName: string;
        fileUrl: string;
        mimeType: string | null;
        sizeBytes: number | null;
    }[];
}

interface PendingBrief {
    id: string;
    title: string;
    status: string;
    scopeScore: number | null;
    submittedAt: string | null;
    branding?: {
        logoUrl?: string | null;
        accentColor?: string | null;
        introMessage?: string | null;
        successMessage?: string | null;
        supportEmail?: string | null;
        source?: "workspace" | "template_override" | null;
    } | null;
    fields: BriefField[];
}

interface ClarificationRequestItem {
    id: string;
    fieldKey: string;
    fieldLabel: string;
    prompt: string;
    severity: "low" | "medium" | "high";
    sourceFlagId: string | null;
    sortOrder: number;
}

interface ClarificationRequest {
    id: string;
    status: string;
    message: string | null;
    requestedAt: string;
    items: ClarificationRequestItem[];
}

interface ChangeOrderSummary {
    id: string;
    title: string;
    description: string | null;
    amount: number | null;
    status: string;
    sentAt: string | null;
    respondedAt: string | null;
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
        plan: string;
    };
    deliverables: Deliverable[];
    health: {
        healthScore: number;
        pendingFlags: number;
        avgBriefScore: number;
        status: string;
    } | null;
    pendingBrief: PendingBrief | null;
    clarificationBrief: PendingBrief | null;
    clarificationRequest: ClarificationRequest | null;
    pendingChangeOrders: ChangeOrderSummary[];
    loading: boolean;
    error: string | null;
}

const defaultSession: PortalSession = {
    token: "",
    project: { id: "", name: "", description: null, status: "", clientName: null },
    workspace: { id: "", name: "", logoUrl: null, brandColor: "#0F6E56", plan: "solo" },
    deliverables: [],
    health: null,
    pendingBrief: null,
    clarificationBrief: null,
    clarificationRequest: null,
    pendingChangeOrders: [],
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

        setPortalToken(portalToken);

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
                    health: data.health,
                    pendingBrief: data.pendingBrief,
                    clarificationBrief: data.clarificationBrief,
                    clarificationRequest: data.clarificationRequest,
                    pendingChangeOrders: data.pendingChangeOrders ?? [],
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

        return () => {
            setPortalToken(null);
        };
    }, [portalToken]);

    return (
        <PortalSessionContext.Provider value={session}>
            {children}
        </PortalSessionContext.Provider>
    );
}

export { PortalSessionContext };
