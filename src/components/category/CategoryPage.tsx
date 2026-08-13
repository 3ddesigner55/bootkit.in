"use client";

import { useCallback, useEffect, useState } from "react";

import CategoryHeader from "./CategoryHeader";
import CategoryLayout from "./CategoryLayout";
import CollectionHubPage from "./CollectionHubPage";
import { isCollectionHub } from "@/config/hubConfig";

interface CategoryPageProps {
  slug: string;
}

export default function CategoryPage({ slug }: CategoryPageProps) {
  const normalizedSlug = slug.toLowerCase();
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const handleCategoryResolved = useCallback(
    (category: { name: string }) => setCategoryName(category.name),
    [],
  );

  useEffect(() => {
    setCategoryName(null);
  }, [slug]);

  if (isCollectionHub(normalizedSlug)) {
    return <CollectionHubPage hub={normalizedSlug} />;
  }

  const title = categoryName ?? slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <main className="min-h-screen bg-[#F8FAF8]">
      {/* Header */}
      <CategoryHeader title={title} />

      {/* Sidebar + Products */}
      <CategoryLayout
        slug={slug}
        onCategoryResolved={handleCategoryResolved}
      />
    </main>
  );
}
