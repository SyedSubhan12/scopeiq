import { db, users, eq, and, isNull, asc } from "@novabots/db";

export const userRepository = {
  async listWorkspaceUsers(workspaceId: string) {
    return db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        userType: users.userType,
      })
      .from(users)
      .where(and(eq(users.workspaceId, workspaceId), isNull(users.deletedAt)))
      .orderBy(asc(users.fullName));
  },

  async getById(workspaceId: string, userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        userType: users.userType,
      })
      .from(users)
      .where(and(eq(users.workspaceId, workspaceId), eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  },
};
