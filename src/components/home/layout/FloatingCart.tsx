import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

export default function FloatingCart() {
  return (
    <div className="fixed bottom-[74px] left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">

      <Link
        href="/cart"
        className="flex h-14 items-center justify-between rounded-full border border-white/40 bg-[var(--primary)]/95 px-4 shadow-[0_12px_35px_rgba(22,101,52,.28)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
      >

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">

            <ShoppingBag
              size={18}
              className="text-white"
            />

          </div>

          <div>

            <p className="text-[10px] uppercase tracking-[.12em] text-white/70">
              2 Items
            </p>

            <p className="text-sm font-black text-white">
              ₹349
            </p>

          </div>

        </div>

        <div className="flex items-center gap-2">

          <span className="text-sm font-semibold">
            View Cart
          </span>

          <ArrowRight size={18} />

        </div>

      </Link>

    </div>
  );
}