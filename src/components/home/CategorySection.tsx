"use client";

import Link from "next/link";
import CategoryCard from "./CategoryCard";

interface CategoryItem {
  name: string;
  image: string;
}

interface CategorySectionProps {
  title: string;
  slug: string;
  items: CategoryItem[];
  onCategoryClick?: () => void;
}

export default function CategorySection({
  title,
  slug,
  items,
  onCategoryClick,
}: CategorySectionProps) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">
          {title}
        </h2>

        <Link
          href={`/category/${slug}`}
          className="text-sm font-semibold text-[var(--primary)]"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-x-3 gap-y-5">
        {items.map((item) => (
          <CategoryCard
            key={item.name}
            name={item.name}
            image={item.image}
            onClick={onCategoryClick}
          />
        ))}
      </div>
    </section>
  );
}