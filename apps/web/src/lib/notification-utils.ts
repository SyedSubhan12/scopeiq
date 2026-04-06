"use client";

import type { AuditLogEntry } from "@/hooks/useNotifications";
import type { AppNotification, NotificationType } from "@/stores/notification.store";

function getNotificationType(entry: AuditLogEntry): NotificationType {
  switch (entry.action) {
    case "approve":
    case "resolve":
      return "success";
    case "reject":
    case "flag":
      return "warning";
    case "delete":
      return "error";
    default:
      return "info";
  }
}

function getEntityHref(entry: AuditLogEntry) {
  switch (entry.entityType) {
    case "project":
      return `/projects/${entry.entityId}`;
    case "brief":
      return "/briefs";
    case "scope_flag":
      return "/scope-flags";
    case "change_order":
      return "/change-orders";
    case "deliverable":
      return `/projects/${entry.entityId}/deliverables`;
    default:
      return "/activity";
  }
}

function getNotificationTitle(entry: AuditLogEntry) {
  const actor = entry.actorName ?? "System";
  const entity = entry.entityType.replace(/_/g, " ");

  switch (entry.action) {
    case "create":
      return `${actor} created ${entity}`;
    case "update":
      return `${actor} updated ${entity}`;
    case "approve":
      return `${actor} approved ${entity}`;
    case "reject":
      return `${actor} rejected ${entity}`;
    case "flag":
      return `${actor} flagged scope deviation`;
    case "resolve":
      return `${actor} resolved ${entity}`;
    default:
      return `${actor} ${entry.action} ${entity}`;
  }
}

function getNotificationBody(entry: AuditLogEntry) {
  const metadataEntries = entry.metadata ? Object.entries(entry.metadata) : [];
  if (metadataEntries.length > 0) {
    return metadataEntries
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ");
  }

  return `Open ${entry.entityType.replace(/_/g, " ")} activity`;
}

export function mapAuditLogEntryToNotification(entry: AuditLogEntry): AppNotification {
  return {
    id: entry.id,
    type: getNotificationType(entry),
    title: getNotificationTitle(entry),
    body: getNotificationBody(entry),
    timestamp: entry.createdAt,
    read: false,
    entityHref: getEntityHref(entry),
  };
}

