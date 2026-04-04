"use client";

import { Badge, Button, Skeleton, useToast } from "@novabots/ui";
import { Trash2, Clock, Mail } from "lucide-react";
import { useInvitations, useRevokeInvite } from "@/hooks/useInvitations";

export function TeamMemberList() {
    const { data, isLoading } = useInvitations();
    const revokeInvite = useRevokeInvite();
    const { toast } = useToast();

    const invitations = data?.data ?? [];

    const handleRevoke = async (id: string) => {
        try {
            await revokeInvite.mutateAsync(id);
            toast("success", "Invitation revoked");
        } catch {
            toast("error", "Failed to revoke invitation");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    if (invitations.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-[rgb(var(--border-default))] bg-white p-8 text-center">
                <Mail className="mx-auto mb-3 h-8 w-8 text-[rgb(var(--text-muted))]" />
                <p className="text-sm text-[rgb(var(--text-muted))]">
                    No pending invitations. Use the form above to invite team members.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-default))] bg-white">
            <div className="border-b border-[rgb(var(--border-subtle))] px-5 py-3">
                <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                    Pending Invitations
                </h3>
            </div>
            <div className="divide-y divide-[rgb(var(--border-subtle))]">
                {invitations.map((inv) => {
                    const isExpired = new Date(inv.expiresAt) < new Date();
                    const isAccepted = !!inv.acceptedAt;

                    return (
                        <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))]">
                                    <Mail className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                        {inv.email}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
                                        <span className="capitalize">{inv.role}</span>
                                        <span>·</span>
                                        <Clock className="h-3 w-3" />
                                        <span>
                                            Expires{" "}
                                            {new Date(inv.expiresAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isAccepted ? (
                                    <Badge status="active">Accepted</Badge>
                                ) : isExpired ? (
                                    <Badge status="inactive">Expired</Badge>
                                ) : (
                                    <>
                                        <Badge status="pending">Pending</Badge>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => void handleRevoke(inv.id)}
                                            disabled={revokeInvite.isPending}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
