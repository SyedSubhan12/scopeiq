import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  entityHref?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  replaceNotifications: (notifications: AppNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const STORAGE_KEY = "scopeiq-notifications";

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function computeUnreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) =>
        set((state) => {
          const newNotification: AppNotification = {
            ...notification,
            id: generateId(),
            timestamp: new Date().toISOString(),
            read: false,
          };
          const updated = [newNotification, ...state.notifications].slice(0, 100);
          return {
            notifications: updated,
            unreadCount: computeUnreadCount(updated),
          };
        }),

      replaceNotifications: (incomingNotifications) =>
        set((state) => {
          const existingReadMap = new Map(
            state.notifications.map((notification) => [notification.id, notification.read]),
          );

          const updated = incomingNotifications.map((notification) => ({
            ...notification,
            read: existingReadMap.get(notification.id) ?? notification.read,
          }));

          return {
            notifications: updated,
            unreadCount: computeUnreadCount(updated),
          };
        }),

      markAsRead: (id) =>
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          );
          return {
            notifications: updated,
            unreadCount: computeUnreadCount(updated),
          };
        }),

      markAllAsRead: () =>
        set((state) => {
          const updated = state.notifications.map((n) => ({ ...n, read: true }));
          return {
            notifications: updated,
            unreadCount: 0,
          };
        }),

      clearNotifications: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),
    }),
    {
      name: STORAGE_KEY,
    },
  ),
);
