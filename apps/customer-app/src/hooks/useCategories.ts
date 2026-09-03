"use client";

import { useState } from "react";
import { categories as defaultCategories } from "@/data/categories";
import type { Category } from "@/types/category";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [hydrated, setHydrated] = useState(true);

  const activeCategories = categories.filter((c) => c.active !== false);

  return {
    categories,
    activeCategories,
    hydrated,
  };
}
