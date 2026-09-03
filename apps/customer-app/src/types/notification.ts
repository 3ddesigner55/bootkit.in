export type NotificationType =
  | "ORDER"
  | "OFFER"
  | "DELIVERY"
  | "PAYMENT"
  | "SYSTEM";

export type BootkitNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  read: boolean;
  createdAt: string;
};

export type NotificationInput = Omit<
  BootkitNotification,
  "id" | "read" | "createdAt"
>;

export type NotificationContextValue = {
  notifications: BootkitNotification[];
  unreadCount: number;
  hydrated: boolean;
  addNotification: (input: NotificationInput) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
};