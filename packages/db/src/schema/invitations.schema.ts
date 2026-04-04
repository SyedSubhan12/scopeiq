import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { userRoleEnum } from './enums';
import { workspaces } from './workspaces.schema';
import { users } from './users.schema';

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    role: userRoleEnum("role").notNull().default("member"),
    token: uuid("token").notNull().unique().defaultRandom(),
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("idx_invitations_workspace").on(table.workspaceId),
    tokenIdx: index("idx_invitations_token").on(table.token),
    emailWorkspaceIdx: index("idx_invitations_email_workspace").on(
      table.email,
      table.workspaceId,
    ),
  }),
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
