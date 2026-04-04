"use client";

import { useState, useEffect } from "react";
import { Button, Input, Skeleton, useToast } from "@novabots/ui";
import { UserCheck, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface InviteInfo {
    email: string;
    role: string;
    workspaceName: string;
}

export default function InviteAcceptPage({
    params,
}: {
    params: { token: string };
}) {
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleAccept = async () => {
        if (!fullName.trim() || !password.trim()) return;
        setAccepting(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/invites/accept`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: params.token,
                    fullName: fullName.trim(),
                    password: password.trim(),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error?.message || "Failed to accept invitation");
            }

            toast("success", "Welcome to the team! Redirecting to login...");
            setTimeout(() => router.push("/login"), 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setAccepting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
                    Accept Invitation
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Create your account to join the workspace.
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="space-y-3">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                        Full Name
                    </label>
                    <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                        Password
                    </label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password (min 8 characters)"
                    />
                </div>
            </div>

            <Button
                className="w-full"
                onClick={() => void handleAccept()}
                disabled={!fullName.trim() || password.length < 8 || accepting}
            >
                {accepting ? "Creating account..." : "Accept & Join Workspace"}
            </Button>

            <p className="text-center text-xs text-[rgb(var(--text-muted))]">
                Already have an account?{" "}
                <a href="/login" className="text-primary hover:underline">
                    Log in
                </a>
            </p>
        </div>
    );
}
