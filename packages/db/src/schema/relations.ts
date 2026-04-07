/**
 * All Drizzle ORM `relations()` definitions are consolidated here to avoid
 * circular import chains between schema files. Each schema file exports only
 * its table definition and inferred types — no cross-schema imports except
 * for FK column thunks that are already lazy.
 */
import { relations } from "drizzle-orm";

import { workspaces } from './workspaces.schema';
import { users } from './users.schema';
import { clients } from './clients.schema';
import { projects } from './projects.schema';
import { briefTemplates } from './brief-templates.schema';
import { briefTemplateVersions } from './brief-template-versions.schema';
import { briefs } from './briefs.schema';
import { briefFields } from './brief-fields.schema';
import { briefAttachments } from './brief-attachments.schema';
import { briefVersions } from './brief-versions.schema';
import { briefClarificationRequests } from './brief-clarification-requests.schema';
import { briefClarificationItems } from './brief-clarification-items.schema';
import { deliverables } from './deliverables.schema';
import { feedbackItems } from './feedback-items.schema';
import { approvalEvents } from './approval-events.schema';
import { reminderLogs } from './reminder-logs.schema';
import { statementsOfWork } from './statements-of-work.schema';
import { sowClauses } from './sow-clauses.schema';
import { scopeFlags } from './scope-flags.schema';
import { changeOrders } from './change-orders.schema';
import { rateCardItems } from './rate-card-items.schema';
import { invitations } from './invitations.schema';

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  projects: many(projects),
  briefs: many(briefs),
  deliverables: many(deliverables),
  statementsOfWork: many(statementsOfWork),
  scopeFlags: many(scopeFlags),
  changeOrders: many(changeOrders),
  rateCardItems: many(rateCardItems),
  briefTemplates: many(briefTemplates),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [users.workspaceId],
    references: [workspaces.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [clients.workspaceId],
    references: [workspaces.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  sow: one(statementsOfWork, {
    fields: [projects.sowId],
    references: [statementsOfWork.id],
  }),
  briefs: many(briefs),
  deliverables: many(deliverables),
  scopeFlags: many(scopeFlags),
  changeOrders: many(changeOrders),
}));

export const briefTemplatesRelations = relations(briefTemplates, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [briefTemplates.workspaceId],
    references: [workspaces.id],
  }),
  briefs: many(briefs),
  versions: many(briefTemplateVersions),
}));

export const briefTemplateVersionsRelations = relations(briefTemplateVersions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [briefTemplateVersions.workspaceId],
    references: [workspaces.id],
  }),
  template: one(briefTemplates, {
    fields: [briefTemplateVersions.templateId],
    references: [briefTemplates.id],
  }),
  publisher: one(users, {
    fields: [briefTemplateVersions.publishedBy],
    references: [users.id],
  }),
}));

export const briefsRelations = relations(briefs, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [briefs.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [briefs.projectId],
    references: [projects.id],
  }),
  template: one(briefTemplates, {
    fields: [briefs.templateId],
    references: [briefTemplates.id],
  }),
  templateVersion: one(briefTemplateVersions, {
    fields: [briefs.templateVersionId],
    references: [briefTemplateVersions.id],
  }),
  reviewer: one(users, {
    fields: [briefs.reviewerId],
    references: [users.id],
  }),
  fields: many(briefFields),
  attachments: many(briefAttachments),
  versions: many(briefVersions),
  clarificationRequests: many(briefClarificationRequests),
}));

export const briefFieldsRelations = relations(briefFields, ({ one }) => ({
  brief: one(briefs, {
    fields: [briefFields.briefId],
    references: [briefs.id],
  }),
}));

export const briefAttachmentsRelations = relations(briefAttachments, ({ one }) => ({
  brief: one(briefs, {
    fields: [briefAttachments.briefId],
    references: [briefs.id],
  }),
  workspace: one(workspaces, {
    fields: [briefAttachments.workspaceId],
    references: [workspaces.id],
  }),
}));

export const briefVersionsRelations = relations(briefVersions, ({ one }) => ({
  brief: one(briefs, {
    fields: [briefVersions.briefId],
    references: [briefs.id],
  }),
  workspace: one(workspaces, {
    fields: [briefVersions.workspaceId],
    references: [workspaces.id],
  }),
  reviewer: one(users, {
    fields: [briefVersions.reviewerId],
    references: [users.id],
  }),
}));

export const briefClarificationRequestsRelations = relations(briefClarificationRequests, ({ one, many }) => ({
  brief: one(briefs, {
    fields: [briefClarificationRequests.briefId],
    references: [briefs.id],
  }),
  workspace: one(workspaces, {
    fields: [briefClarificationRequests.workspaceId],
    references: [workspaces.id],
  }),
  version: one(briefVersions, {
    fields: [briefClarificationRequests.briefVersionId],
    references: [briefVersions.id],
  }),
  requester: one(users, {
    fields: [briefClarificationRequests.requestedBy],
    references: [users.id],
  }),
  items: many(briefClarificationItems),
}));

export const briefClarificationItemsRelations = relations(briefClarificationItems, ({ one }) => ({
  request: one(briefClarificationRequests, {
    fields: [briefClarificationItems.requestId],
    references: [briefClarificationRequests.id],
  }),
}));

export const deliverablesRelations = relations(deliverables, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [deliverables.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [deliverables.projectId],
    references: [projects.id],
  }),
  feedbackItems: many(feedbackItems),
  approvalEvents: many(approvalEvents),
  reminderLogs: many(reminderLogs),
}));

export const feedbackItemsRelations = relations(feedbackItems, ({ one }) => ({
  deliverable: one(deliverables, {
    fields: [feedbackItems.deliverableId],
    references: [deliverables.id],
  }),
}));

export const approvalEventsRelations = relations(approvalEvents, ({ one }) => ({
  deliverable: one(deliverables, {
    fields: [approvalEvents.deliverableId],
    references: [deliverables.id],
  }),
}));

export const reminderLogsRelations = relations(reminderLogs, ({ one }) => ({
  deliverable: one(deliverables, {
    fields: [reminderLogs.deliverableId],
    references: [deliverables.id],
  }),
}));

export const statementsOfWorkRelations = relations(statementsOfWork, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [statementsOfWork.workspaceId],
    references: [workspaces.id],
  }),
  clauses: many(sowClauses),
  projects: many(projects),
}));

export const sowClausesRelations = relations(sowClauses, ({ one, many }) => ({
  sow: one(statementsOfWork, {
    fields: [sowClauses.sowId],
    references: [statementsOfWork.id],
  }),
  scopeFlags: many(scopeFlags),
}));

export const scopeFlagsRelations = relations(scopeFlags, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [scopeFlags.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [scopeFlags.projectId],
    references: [projects.id],
  }),
  sowClause: one(sowClauses, {
    fields: [scopeFlags.sowClauseId],
    references: [sowClauses.id],
  }),
  changeOrders: many(changeOrders),
}));

export const changeOrdersRelations = relations(changeOrders, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [changeOrders.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [changeOrders.projectId],
    references: [projects.id],
  }),
  scopeFlag: one(scopeFlags, {
    fields: [changeOrders.scopeFlagId],
    references: [scopeFlags.id],
  }),
}));

export const rateCardItemsRelations = relations(rateCardItems, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [rateCardItems.workspaceId],
    references: [workspaces.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [invitations.workspaceId],
    references: [workspaces.id],
  }),
  invitedByUser: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));
