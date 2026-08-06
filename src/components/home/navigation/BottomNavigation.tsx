"use client";

import Link from "next/link";
import { Home, Grid2x2, Package, User } from "lucide-react";
import { usePathname } from "next/navigation";

const menus = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Categories",
    href: "/categories",
    icon: Grid2x2,
  },
  {
    label: "Orders",
    href: "/orders",
    icon: Package,
  },
  {
    label: "Profile",
    href: "/account",
    icon: User,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-24px)] max-w-md -translate-x-1/2">

      <div className="flex h-16 items-center justify-around rounded-full border border-white/40 bg-white/85 px-3 shadow-[0_10px_35px_rgba(0,0,0,.08)] backdrop-blur-xl">

        {menus.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  active
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                <Icon size={19} />
              </div>

              <span
                className={`mt-1 text-[10px] font-semibold ${
                  active
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

    </nav>
  );
}