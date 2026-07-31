"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  ChevronRight,
  CreditCard,
  Package,
  Percent,
  Trash2,
  Truck,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useNotifications } from "@/hooks/useNotifications";
import type {
  BootkitNotification,
  NotificationType,
} from "@/types/notification";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    hydrated,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
  } = useNotifications();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/account"
                aria-label="Back to account"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
              >
                <ArrowLeft size={19} />
              </Link>

              <div>
                <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                  Notifications
                </h1>

                <p className="text-xs text-[var(--text-muted)]">
                  {unreadCount} unread notifications
                </p>
              </div>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-[11px] font-black text-[var(--primary)]"
              >
                <CheckCheck size={15} />
                Read all
              </button>
            )}
          </div>

          {!hydrated ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-[20px] bg-white"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <section className="flex min-h-[440px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center shadow-[var(--shadow-sm)]">
              <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--primary-light)] text-[var(--primary)]">
                <Bell size={35} />
              </span>

              <h2 className="mt-6 text-2xl font-black text-[var(--text-primary)]">
                No notifications
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
                Order, payment, delivery and offer updates will
                appear here.
              </p>

              <Link
                href="/"
                className="mt-6 rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-black text-white"
              >
                Continue shopping
              </Link>
            </section>
          ) : (
            <>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onRead={() =>
                      markAsRead(notification.id)
                    }
                    onRemove={() =>
                      removeNotification(notification.id)
                    }
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={clearNotifications}
                className="mx-auto mt-6 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black text-[var(--danger)]"
              >
                <Trash2 size={15} />
                Clear all notifications
              </button>
            </>
          )}
        </Container>
      </main>
    </div>
  );
}

function NotificationCard({
  notification,
  onRead,
  onRemove,
}: {
  notification: BootkitNotification;
  onRead: () => void;
  onRemove: () => void;
}) {
  const content = (
    <div
      className={`flex items-start gap-3 rounded-[20px] border p-4 transition ${
        notification.read
          ? "border-[var(--border)] bg-white"
          : "border-[var(--primary)] bg-[var(--primary-light)]"
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-[var(--primary)] shadow-[var(--shadow-xs)]">
        <NotificationIcon type={notification.type} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h2 className="flex-1 text-sm font-black text-[var(--text-primary)]">
            {notification.title}
          </h2>

          {!notification.read && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
          )}
        </div>

        <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">
          {notification.message}
        </p>

        <p className="mt-2 text-[9px] font-semibold text-[var(--text-muted)]">
          {new Date(notification.createdAt).toLocaleString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }
          )}
        </p>
      </div>

      {notification.href && (
        <ChevronRight
          size={17}
          className="mt-3 shrink-0 text-[var(--text-muted)]"
        />
      )}

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove();
        }}
        aria-label="Remove notification"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)]"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  if (!notification.href) {
    return (
      <button
        type="button"
        onClick={onRead}
        className="block w-full text-left"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={notification.href}
      onClick={onRead}
      className="block"
    >
      {content}
    </Link>
  );
}

function NotificationIcon({
  type,
}: {
  type: NotificationType;
}) {
  if (type === "ORDER") return <Package size={20} />;
  if (type === "DELIVERY") return <Truck size={20} />;
  if (type === "PAYMENT") return <CreditCard size={20} />;
  if (type === "OFFER") return <Percent size={20} />;

  return <Bell size={20} />;
}