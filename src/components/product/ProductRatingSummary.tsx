"use client";

import { Star } from "lucide-react";

type Props = {
  rating: number;
  reviewCount: number;
};

const breakdown = [
  { stars: 5, percent: 82 },
  { stars: 4, percent: 12 },
  { stars: 3, percent: 4 },
  { stars: 2, percent: 1 },
  { stars: 1, percent: 1 },
];

export default function ProductRatingSummary({
  rating,
  reviewCount,
}: Props) {
  return (
    <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
      <h2 className="text-xl font-black">
        Customer Ratings
      </h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">

        <div className="text-center">
          <div className="text-5xl font-black">
            {rating.toFixed(1)}
          </div>

          <div className="mt-2 flex justify-center">
            {[1,2,3,4,5].map((item)=>(
              <Star
                key={item}
                size={18}
                fill="currentColor"
                className="text-yellow-500"
              />
            ))}
          </div>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Based on {reviewCount} reviews
          </p>
        </div>

        <div className="space-y-4">
          {breakdown.map((item)=>(
            <div
              key={item.stars}
              className="flex items-center gap-3"
            >
              <span className="w-10 text-sm font-bold">
                {item.stars}★
              </span>

              <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)]"
                  style={{
                    width: `${item.percent}%`,
                  }}
                />
              </div>

              <span className="w-10 text-right text-xs font-bold">
                {item.percent}%
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}