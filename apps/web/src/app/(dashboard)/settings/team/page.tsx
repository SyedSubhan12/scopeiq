"use client";

import { InviteTeamMember } from "@/components/settings/InviteTeamMember";
import { TeamMemberList } from "@/components/settings/TeamMemberList";
import { Users } from "lucide-react";

export default function TeamSettingsPage() {
    return (
        <div className="max-w-3xl">
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[rgb(var(--text-muted))]" />
                    <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Team</h1>
                </div>
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Invite team members to your workspace
                </p>
            </div>

            <div className="space-y-6">
                <InviteTeamMember />
                <TeamMemberList />
            </div>
        </div>
    );
}
