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
    <header className="sticky top-0 z-40 border-b bg-white">

      <div className="flex items-center gap-3 px-4 pt-4">

        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full border"
        >
          <ArrowLeft size={22} />
        </Link>

        <div className="min-w-0 flex-1">

          <h1 className="truncate text-[28px] font-black">
            {title}
          </h1>

          <div className="mt-1 flex items-center gap-1">

            <span className="text-sm font-bold text-[var(--primary)]">
              Delivering to
            </span>

            <span className="truncate text-sm font-semibold text-gray-700">
              Sardarshahar
            </span>

            <ChevronDown size={16} />

          </div>

        </div>

        <button className="flex h-11 w-11 items-center justify-center rounded-full border">
          <Search size={21} />
        </button>

        <button className="flex h-11 w-11 items-center justify-center rounded-full border">
          <Share2 size={20} />
        </button>

      </div>

    </header>
  );
}