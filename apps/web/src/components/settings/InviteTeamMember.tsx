"use client";

import { useState } from "react";
import { Button, Input, useToast } from "@novabots/ui";
import { Mail, UserPlus } from "lucide-react";
import { useCreateInvite } from "@/hooks/useInvitations";

export function InviteTeamMember() {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "member">("member");
    const createInvite = useCreateInvite();
    const { toast } = useToast();

    const handleInvite = async () => {
        if (!email.trim()) return;
        try {
            await createInvite.mutateAsync({ email: email.trim(), role });
            toast("success", `Invite sent to ${email}`);
            setEmail("");
            setRole("member");
        } catch {
            toast("error", "Failed to send invite");
        }
    };

    return (
        <div className="rounded-xl border border-[rgb(var(--border-default))] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                    Invite Team Member
                </h3>
            </div>

            <div className="flex items-end gap-3">
                <div className="flex-1">
                    <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">Email</label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="colleague@agency.com"
                    />
                </div>
                <div className="w-32">
                    <label className="mb-1 block text-xs text-[rgb(var(--text-muted))]">Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as "admin" | "member")}
                        className="w-full rounded-lg border border-[rgb(var(--border-default))] px-2 py-2 text-sm outline-none focus:border-primary"
                    >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <Button
                    size="sm"
                    onClick={() => void handleInvite()}
                    disabled={!email.trim() || createInvite.isPending}
                >
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    {createInvite.isPending ? "Sending..." : "Send Invite"}
                </Button>
            </div>
        </div>
    );
}
