"use client";

import { useParams } from "next/navigation";
import CategoryPage from "@/components/category/CategoryPage";

export default function Page() {
  const params = useParams<{ slug: string }>();

  return (
    <CategoryPage
      slug={decodeURIComponent(params.slug)}
    />
  );
}