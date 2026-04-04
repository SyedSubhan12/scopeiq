import { db, users, workspaces, eq } from "@novabots/db";
import { workspaceRepository } from "../repositories/workspace.repository.js";
import { User } from "@supabase/supabase-js";

export const userSyncService = {
    /**
     * Ensures that a Supabase-authenticated user has a corresponding
     * record in our application database and an associated workspace.
     * This handles 'lazy provisioning' for first-time OAuth signups.
     */
    async ensureUser(authUser: User) {
        // 1. Check if user already exists
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.authUid, authUser.id))
            .limit(1);

        if (existingUser) {
            return existingUser;
        }

        // 2. User doesn't exist - create a default workspace first
        console.log(`[UserSync] Provisioning new user for ${authUser.email}`);

        const emailPrefix = authUser.email?.split("@")[0] || "user";
        const slug = `${emailPrefix}-${Date.now().toString(36)}`;

        const workspace = await workspaceRepository.create({
            name: `${emailPrefix}'s Workspace`,
            slug,
        });

        if (!workspace) {
            throw new Error("Failed to create default workspace for new user");
        }

        // 3. Create the user record
        const [user] = await db
            .insert(users)
            .values({
                workspaceId: workspace.id,
                authUid: authUser.id,
                email: authUser.email!,
                fullName: authUser.user_metadata?.full_name || emailPrefix,
                role: "owner",
            })
            .returning();

        return user!;
    },
};
