import { db, users, workspaces, eq } from "@novabots/db";
import { User } from "@supabase/supabase-js";

export const userSyncService = {
    async ensureUser(authUser: User) {
        // Fast path — user already exists (vast majority of requests)
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.authUid, authUser.id))
            .limit(1);

        if (existingUser) {
            return existingUser;
        }

        // Slow path — first-ever request for this OAuth user.
        // Run inside a transaction so workspace + user are created atomically.
        // onConflictDoNothing on the user insert handles the edge case where two
        // concurrent first-requests race past the fast-path read simultaneously.
        return await db.transaction(async (trx) => {
            const emailPrefix = authUser.email?.split("@")[0] ?? "user";

            const [workspace] = await trx
                .insert(workspaces)
                .values({
                    name: `${emailPrefix}'s Workspace`,
                    slug: `${emailPrefix}-${Date.now().toString(36)}`,
                })
                .returning();

            if (!workspace) {
                throw new Error("Failed to create default workspace for new user");
            }

            const [user] = await trx
                .insert(users)
                .values({
                    workspaceId: workspace.id,
                    authUid: authUser.id,
                    email: authUser.email!,
                    fullName: authUser.user_metadata?.full_name ?? emailPrefix,
                    role: "owner",
                })
                .onConflictDoNothing()
                .returning();

            if (user) {
                return user;
            }

            // Another concurrent request won the race — return their user record.
            const [raceWinner] = await trx
                .select()
                .from(users)
                .where(eq(users.authUid, authUser.id))
                .limit(1);

            return raceWinner!;
        });
    },
};
