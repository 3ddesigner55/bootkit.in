"use client";

import Link from "next/link";
import Image from "next/image";

interface SectionItem {
  name: string;
  image: string;
  slug: string;
}

interface SectionBlockProps {
  title: string;
  items: SectionItem[];
}

export default function SectionBlock({
  title,
  items,
}: SectionBlockProps) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">
          {title}
        </h2>

        <Link
          href="/categories"
          className="text-sm font-semibold text-[var(--primary)]"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-x-3 gap-y-5">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/category/${item.slug}`}
            className="group flex flex-col items-center"
          >
            <div className="flex h-[74px] w-[74px] items-center justify-center rounded-2xl border border-[#EDF1EE] bg-[#F5F8F5] transition group-hover:-translate-y-1 group-hover:shadow-md">

              <Image
                src={item.image}
                alt={item.name}
                width={56}
                height={56}
                className="object-contain"
              />

            </div>

            <p className="mt-2 line-clamp-2 text-center text-[11px] font-semibold leading-4">
              {item.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}