"use client";

import Link from "next/link";

const banners = [
  "/images/featured/week1.png",
  "/images/featured/week2.png",
  "/images/featured/week3.png",
  "/images/featured/week4.png",
];

export default function FeaturedThisWeek() {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Featured This Week
        </h2>

        <Link
          href="/featured"
          className="text-sm font-semibold text-green-600"
        >
          See All
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {banners.map((banner, index) => (
          <img
            key={index}
            src={banner}
            alt=""
            className="h-44 w-36 flex-shrink-0 rounded-2xl object-cover"
          />
        ))}
      </div>
    </section>
  );
}
