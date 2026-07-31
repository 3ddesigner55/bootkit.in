"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { useAdminCategories } from "@/hooks/useAdminCategories";

export default function CategorySection() {
  const {
  activeCategories: categories,
  hydrated,
} = useAdminCategories();

if (!hydrated) {
  return null;
}

  return (
    <section className="py-5 sm:py-7 lg:py-9">
      <Container>
        <SectionHeading
          title="Shop by category"
          description="Everything you need for your home, delivered from nearby stores."
          actionLabel="View all"
          actionHref="/categories"
        />

        <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 md:grid-cols-6 xl:grid-cols-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group w-[126px] shrink-0 snap-start sm:w-auto"
            >
              <div className="relative h-full overflow-hidden rounded-[20px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-xs)] transition duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
                <div
                  className="flex aspect-square items-center justify-center rounded-[16px] text-[42px] transition duration-300 group-hover:scale-[1.03]"
                  style={{ backgroundColor: category.background }}
                  aria-hidden="true"
                >
                  {category.icon}
                </div>

                <div className="mt-3">
                  <h3 className="line-clamp-2 min-h-10 text-[13px] font-extrabold leading-5 text-[var(--text-primary)]">
                    {category.name}
                  </h3>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                      {category.productCount} products
                    </span>

                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                      <ArrowRight size={12} strokeWidth={2.5} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}