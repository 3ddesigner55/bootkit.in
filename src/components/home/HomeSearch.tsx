import Link from "next/link";
import { Mic, Search } from "lucide-react";

export default function HomeSearch() {
  return (
    <Link
      href="/search"
      className="mt-5 flex h-[58px] items-center gap-3 rounded-[20px] border border-[#e6efe8] bg-white px-4 shadow-[0_8px_25px_rgba(0,0,0,.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,.08)]"
    >
      {/* Search Icon */}

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F8F5]">

        <Search
          size={18}
          className="text-[var(--primary)]"
        />

      </div>

      {/* Placeholder */}

      <div className="flex-1">

        <p className="text-[13px] font-semibold text-[var(--text-muted)]">
          Search groceries, fruits, milk...
        </p>

      </div>

      {/* Voice */}

      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] transition hover:scale-105"
      >

        <Mic
          size={18}
          className="text-[var(--primary)]"
        />

      </button>

    </Link>
  );
}