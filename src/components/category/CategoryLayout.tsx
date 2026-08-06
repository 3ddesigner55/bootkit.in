"use client";

import { useState } from "react";

import CategorySidebar from "./CategorySidebar";
import CategoryProductGrid from "./CategoryProductGrid";
import CategoryFilters from "./CategoryFilters";

interface CategoryLayoutProps {
  slug: string;
}

export default function CategoryLayout({
  slug,
}: CategoryLayoutProps) {
  const [selectedCategory, setSelectedCategory] =
    useState(slug);

  return (
    <section className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#F5F7F5]">

      {/* LEFT */}

      <div className="h-full w-[90px] shrink-0">
        <CategorySidebar
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* RIGHT */}

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">

        {/* Filters */}

        <CategoryFilters />

        {/* Products */}

        <CategoryProductGrid
          categorySlug={selectedCategory}
        />

      </div>

    </section>
  );
}
