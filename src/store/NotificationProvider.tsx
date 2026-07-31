"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  BootkitNotification,
  NotificationContextValue,
  NotificationInput,
} from "@/types/notification";

export const NotificationContext =
  createContext<NotificationContextValue | null>(null);

const STORAGE_KEY = "bootkit_notifications_v1";
const MAX_NOTIFICATIONS = 50;

function createNotificationId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `notification_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function isValidNotification(
  value: unknown
): value is BootkitNotification {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<BootkitNotification>;

  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.message === "string" &&
    typeof item.read === "boolean" &&
    typeof item.createdAt === "string"
  );
}

function readStoredNotifications(): BootkitNotification[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isValidNotification)
      .slice(0, MAX_NOTIFICATIONS);
  } catch {
    return [];
  }
}

export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<
    BootkitNotification[]
  >([]);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setNotifications(readStoredNotifications());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notifications)
      );
    } catch {
      // Storage failure should not break the app.
    }
  }, [notifications, hydrated]);

  const addNotification = useCallback(
    (input: NotificationInput) => {
      const notification: BootkitNotification = {
        ...input,
        id: createNotificationId(),
        read: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((current) =>
        [notification, ...current].slice(
          0,
          MAX_NOTIFICATIONS
        )
      );
    },
    []
  );

  const markAsRead = useCallback(
    (notificationId: string) => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );
    },
    []
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }, []);

  const removeNotification = useCallback(
    (notificationId: string) => {
      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !== notificationId
        )
      );
    },
    []
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read
      ).length,
    [notifications]
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      hydrated,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearNotifications,
    }),
    [
      notifications,
      unreadCount,
      hydrated,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}