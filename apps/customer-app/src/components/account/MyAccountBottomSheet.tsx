"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Gift,
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  UserCircle2,
  X,
} from "lucide-react";

import { useAccount } from "@/hooks/useAccount";

type MyAccountBottomSheetProps = {
  open: boolean;
  onClose: () => void;
};

const accountActions = [
  { label: "My Orders", icon: Package },
  { label: "My Addresses", icon: MapPin },
  { label: "Wishlist", icon: Heart },
  { label: "Offers & Coupons", icon: Gift },
  { label: "Account Settings", icon: Settings },
];

export default function MyAccountBottomSheet({
  open,
  onClose,
}: MyAccountBottomSheetProps) {
  const { profile, logout } = useAccount();
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(true);

  const closeSheet = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 300);
  }, [onClose]);

  const handleLogout = () => {
    logout();
    closeSheet();
  };

  useEffect(() => {
    if (open) {
      setMounted(true);

      const animationFrame = window.requestAnimationFrame(() => {
        setClosing(false);
      });
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.cancelAnimationFrame(animationFrame);
        document.body.style.overflow = previousOverflow;
      };
    }

    if (!mounted) {
      return;
    }

    setClosing(true);
    const closeTimer = window.setTimeout(() => setMounted(false), 300);

    return () => window.clearTimeout(closeTimer);
  }, [mounted, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSheet();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSheet, open]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-account-bottom-sheet-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeSheet();
        }
      }}
      className={`fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
    >
      <section
        className={`safe-bottom flex h-[78vh] w-full max-w-md flex-col rounded-t-[28px] bg-white shadow-[0_-18px_60px_rgba(0,0,0,0.20)] transition-transform duration-300 ${
          closing ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-[#DCE6DF]" />

        <div className="flex items-center border-b border-[#EEF2EF] px-4 py-4">
          <button
            type="button"
            onClick={closeSheet}
            aria-label="Close my account"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-primary)] transition hover:bg-[#F5F8F5]"
          >
            <X size={20} />
          </button>

          <h2
            id="my-account-bottom-sheet-title"
            className="flex-1 pr-10 text-center text-base font-black text-[var(--text-primary)]"
          >
            My Account
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div className="flex items-center gap-3 border-b border-[#EEF2EF] pb-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F5F8F5] text-[var(--primary)]">
              <UserCircle2 size={26} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-[var(--text-primary)]">
                {profile.fullName || profile.phone}
              </span>
              <span className="mt-1 block text-xs font-medium text-[var(--text-muted)]">
                {profile.phone}
              </span>
            </span>
          </div>

          <div className="py-2">
            {accountActions.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex h-14 items-center gap-3 border-b border-[#EEF2EF] last:border-b-0"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F8F5] text-[var(--primary)]">
                  <Icon size={19} />
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex h-12 w-full items-center gap-3 rounded-2xl text-left text-[var(--danger)] transition hover:bg-[#FFF5F5]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF5F5]">
              <LogOut size={19} />
            </span>
            <span className="text-sm font-black">Logout</span>
          </button>
        </div>
      </section>
    </div>
  );
}
