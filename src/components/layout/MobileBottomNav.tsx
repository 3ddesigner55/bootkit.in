"use client";
import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid2X2,
  Heart,
  Home,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import ProductCollectionBottomSheet from "@/components/product/ProductCollectionBottomSheet";
import { ORDER_AGAIN_CATEGORIES } from "@/components/home/bestSellerData";
import { products } from "@/data/products";

export default function MobileBottomNav() {
  const [showNav, setShowNav] = useState(true);
  const [orderAgainOpen, setOrderAgainOpen] = useState(false);
  const pathname = usePathname();

  const {
  unreadCount,
  hydrated: notificationsHydrated,
} = useNotifications();

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

  useEffect(() => {
  let lastScrollY = window.scrollY;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down
      setShowNav(false);
    } else {
      // Scrolling up
      setShowNav(true);
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener("scroll", handleScroll);

  return () =>
    window.removeEventListener("scroll", handleScroll);
}, []);

  if (shouldHide) return null;

  return (
    <>
      <nav
  aria-label="Mobile navigation"
  className={cn(
    "safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/80 bg-white/95 shadow-[0_-10px_30px_rgba(15,23,18,0.12)] backdrop-blur-xl transition-transform duration-300 lg:hidden",
    showNav
      ? "translate-y-0"
      : "translate-y-full"
  )}
>
      <div className="grid h-[64px] grid-cols-5 items-center px-2">
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

        <NavigationButton
          label="Order Again"
          icon={RotateCcw}
          onClick={() => setOrderAgainOpen(true)}
        />

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

      <ProductCollectionBottomSheet
        open={orderAgainOpen}
        title="Order Again"
        products={products.filter((product) => product.bestseller)}
        categories={ORDER_AGAIN_CATEGORIES}
        initialCategory="All"
        showSearch
        onClose={() => setOrderAgainOpen(false)}
      />
    </>
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

type NavigationButtonProps = {
  label: string;
  icon: typeof Home;
  onClick: () => void;
};

function NavigationButton({
  label,
  icon: Icon,
  onClick,
}: NavigationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full flex-col items-center justify-center gap-1 rounded-xl text-[var(--text-muted)] transition active:scale-95"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface-soft)] shadow-[inset_0_1px_2px_rgba(15,23,18,.08)]">
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className="text-[9px] font-bold">{label}</span>
    </button>
  );
}
