"use client";

import CategoryHeader from "./CategoryHeader";
import CategoryFilters from "./CategoryFilters";
import CategoryLayout from "./CategoryLayout";

interface CategoryPageProps {
  slug: string;
}

export default function CategoryPage({
  slug,
}: CategoryPageProps) {
  const title = slug
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

  return (
    <main className="min-h-screen bg-[#F8FAF8]">
      {/* Header */}
      <CategoryHeader title={title} />



      {/* Sidebar + Products */}
      <CategoryLayout slug={slug} />
    </main>
  );
}