"use client";

import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid2X2,
  Heart,
  Home,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const {
  unreadCount,
  hydrated: notificationsHydrated,
} = useNotifications();

  const {
    totalItems: cartItems,
    hydrated: cartHydrated,
  } = useCart();

  const {
    totalItems: wishlistItems,
    hydrated: wishlistHydrated,
  } = useWishlist();

  const hiddenRoutes = [
    "/checkout",
    "/order-success",
  ];

  const shouldHide = hiddenRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  if (shouldHide) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/80 bg-white/95 shadow-[0_-10px_30px_rgba(15,23,18,0.12)] backdrop-blur-xl lg:hidden"
    >
      <div className="grid h-[64px] grid-cols-5 items-center px-1">
        <NavigationItem
          label="Home"
          href="/"
          icon={Home}
          active={pathname === "/"}
        />

        <NavigationItem
          label="Categories"
          href="/categories"
          icon={Grid2X2}
          active={
            pathname.startsWith("/categories") ||
            pathname.startsWith("/category/")
          }
        />

        <Link
          href="/cart"
          aria-label={`Cart with ${
            cartHydrated ? cartItems : 0
          } items`}
          className="relative -mt-7 flex flex-col items-center justify-center"
        >
          <span
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-[20px] border-4 border-white shadow-[0_10px_0_#0d3e28,0_16px_24px_rgba(12,64,39,.30)] transition active:translate-y-1 active:shadow-[0_5px_0_#0d3e28,0_9px_14px_rgba(12,64,39,.22)]",
              pathname === "/cart"
                ? "bg-[var(--primary-hover)] text-white"
                : "bg-[var(--primary)] text-white"
            )}
          >
            <ShoppingBag size={23} />

            {cartHydrated && cartItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[var(--accent)] px-1 text-[9px] font-black text-[var(--text-primary)]">
                {cartItems > 99 ? "99+" : cartItems}
              </span>
            )}
          </span>

          <span className="mt-1 text-[9px] font-extrabold text-[var(--primary)]">
            Cart
          </span>
        </Link>

        <NavigationItem
          label="Wishlist"
          href="/wishlist"
          icon={Heart}
          active={pathname.startsWith("/wishlist")}
          badge={
            wishlistHydrated
              ? wishlistItems
              : 0
          }
        />

       <NavigationItem
  label="Account"
  href="/account"
  icon={UserRound}
  active={pathname.startsWith("/account")}
  badge={
    notificationsHydrated
      ? unreadCount
      : 0
  }
/>
      </div>
    </nav>
  );
}

type NavigationItemProps = {
  label: string;
  href: string;
  icon: typeof Home;
  active: boolean;
  badge?: number;
};

function NavigationItem({
  label,
  href,
  icon: Icon,
  active,
  badge = 0,
}: NavigationItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1 rounded-xl transition active:scale-95",
        active
          ? "text-[var(--primary)]"
          : "text-[var(--text-muted)]"
      )}
    >
      <span className={cn("relative flex h-8 w-8 items-center justify-center rounded-xl", active ? "bg-[var(--primary-light)] shadow-[inset_0_1px_2px_rgba(22,92,58,.15),0_3px_7px_rgba(15,23,18,.10)]" : "bg-[var(--surface-soft)] shadow-[inset_0_1px_2px_rgba(15,23,18,.08)]")}>
        <Icon
          size={20}
          strokeWidth={active ? 2.5 : 2}
          fill={
            active && label === "Wishlist"
              ? "currentColor"
              : "none"
          }
        />

        {badge > 0 && (
          <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[8px] font-black text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>

      <span className="text-[9px] font-bold">
        {label}
      </span>
    </Link>
  );
}
