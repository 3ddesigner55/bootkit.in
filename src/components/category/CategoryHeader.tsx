"use client";

import Link from "next/link";
import { ArrowLeft, Search, Share2, ChevronDown } from "lucide-react";

interface CategoryHeaderProps {
  title: string;
}

export default function CategoryHeader({
  title,
}: CategoryHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border border-[#EEF2EF] bg-white bg-white ">

      <div className="flex items-center gap-3 px-4 pt-3 pb-2">

        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EEF2EF] bg-white"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="min-w-0 flex-1">

          <h1 className="truncate text-[18px] font-extrabold font-black">
            {title}
          </h1>

          <div className="mt-0.5 flex cursor-pointer items-center gap-1">
            

            <span className="text-[14px] font-semibold text-[var(--primary)] font-bold text-[var(--primary)]">
              Delivering to
            </span>

            <span className="truncate text-[10px] font-semibold text-[var(--primary)]font-semibold text-gray-700">
              Sardarshahar..
            </span>

            <ChevronDown size={15} />

          </div>

        </div>

        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EEF2EF] bg-white">
          <Search size={20} />
        </button>

        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EEF2EF] bg-white">
          <Share2 size={20} />
        </button>

      </div>

    </header>
  );
}