import { pgEnum } from "drizzle-orm/pg-core";

export const projectStatusEnum = pgEnum("project_status_enum", [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
]);

export const briefStatusEnum = pgEnum("brief_status_enum", [
  "pending_score",
  "scored",
  "clarification_needed",
  "approved",
  "rejected",
]);

export const deliverableStatusEnum = pgEnum("deliverable_status_enum", [
  "not_started",
  "in_progress",
  "in_review",
  "revision_requested",
  "approved",
]);

export const deliverableTypeEnum = pgEnum("deliverable_type_enum", [
  "file",
  "figma",
  "loom",
  "youtube",
  "link",
]);

export const flagSeverityEnum = pgEnum("flag_severity_enum", [
  "low",
  "medium",
  "high",
]);

export const flagStatusEnum = pgEnum("flag_status_enum", [
  "pending",
  "confirmed",
  "dismissed",
  "snoozed",
]);

export const changeOrderStatusEnum = pgEnum("change_order_status_enum", [
  "draft",
  "sent",
  "accepted",
  "declined",
  "expired",
]);

export const clauseTypeEnum = pgEnum("clause_type_enum", [
  "deliverable",
  "revision_limit",
  "timeline",
  "exclusion",
  "payment_term",
  "other",
]);

export const userRoleEnum = pgEnum("user_role_enum", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const userTypeEnum = pgEnum("user_type_enum", ["agency", "client"]);

export const planEnum = pgEnum("plan_enum", ["solo", "studio", "agency"]);

export const auditActionEnum = pgEnum("audit_action_enum", [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "flag",
  "send",
  "dismiss",
]);

export const reminderStepEnum = pgEnum("reminder_step_enum", [
  "gentle_nudge",
  "deadline_warning",
  "silence_approval",
]);

export const messageSourceEnum = pgEnum("message_source_enum", [
  "portal",
  "email_forward",
  "manual_input",
]);

export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
export type BriefStatus = (typeof briefStatusEnum.enumValues)[number];
export type DeliverableStatus = (typeof deliverableStatusEnum.enumValues)[number];
export type DeliverableType = (typeof deliverableTypeEnum.enumValues)[number];
export type FlagSeverity = (typeof flagSeverityEnum.enumValues)[number];
export type FlagStatus = (typeof flagStatusEnum.enumValues)[number];
export type ChangeOrderStatus = (typeof changeOrderStatusEnum.enumValues)[number];
export type ClauseType = (typeof clauseTypeEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type UserType = (typeof userTypeEnum.enumValues)[number];
export type Plan = (typeof planEnum.enumValues)[number];
export type AuditAction = (typeof auditActionEnum.enumValues)[number];
export type ReminderStep = (typeof reminderStepEnum.enumValues)[number];
export type MessageSource = (typeof messageSourceEnum.enumValues)[number];
