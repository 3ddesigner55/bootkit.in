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
    <section className="grid h-[calc(100vh-64px)] grid-cols-[90px_1fr] overflow-hidden">

      {/* LEFT */}

      <CategorySidebar
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* RIGHT */}

      <div className="flex h-full flex-col overflow-hidden">

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