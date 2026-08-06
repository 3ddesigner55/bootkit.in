"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  categories as defaultCategories,
} from "@/data/categories";
import type { Category } from "@/types/category";
import type {
  CategoryAdminContextValue,
  CategoryInput,
} from "@/types/categoryAdmin";

export const CategoryAdminContext =
  createContext<CategoryAdminContextValue | null>(
    null
  );

const STORAGE_KEY =
  "bootkit_admin_categories_v1";

function cloneDefaultCategories(): Category[] {
  return defaultCategories.map((category) => ({
    ...category,
  }));
}

function isCategory(
  value: unknown
): value is Category {
  if (!value || typeof value !== "object") {
    return false;
  }

  const category = value as Partial<Category>;

  return (
    typeof category.id === "string" &&
    typeof category.name === "string" &&
    typeof category.slug === "string" &&
    typeof category.description === "string" &&
    typeof category.icon === "string" &&
    typeof category.background === "string" &&
    (category.image === undefined ||
      typeof category.image === "string") &&
    (category.banner === undefined ||
      typeof category.banner === "string") &&
    typeof category.featured === "boolean" &&
    typeof category.active === "boolean" &&
    typeof category.sortOrder === "number" &&
    typeof category.showOnHome === "boolean" &&
    (category.homeLayout === "grid" ||
      category.homeLayout === "slider") &&
    typeof category.displayOrder === "number"
  );
}

function readStoredCategories(): Category[] {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return cloneDefaultCategories();
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return cloneDefaultCategories();
    }

    const validCategories =
      parsed.filter(isCategory);

    if (validCategories.length === 0) {
      return cloneDefaultCategories();
    }

    return validCategories;
  } catch {
    return cloneDefaultCategories();
  }
}

function createCategoryId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `cat_${crypto.randomUUID()}`;
  }

  return `cat_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function createUniqueSlug(
  requestedSlug: string,
  categories: Category[],
  ignoredCategoryId?: string
) {
  const baseSlug =
    requestedSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    "category";

  let slug = baseSlug;
  let counter = 2;

  while (
    categories.some(
      (category) =>
        category.slug === slug &&
        category.id !== ignoredCategoryId
    )
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

function sanitizeCategory(
  category: Category
): Category {
  return {
    ...category,
    name: category.name.trim(),
    slug: category.slug.trim(),
    description:
      category.description.trim(),
    icon: category.icon.trim() || "📦",
    background:
      category.background.trim() ||
      "#F2F5EF",
    image: category.image?.trim() || undefined,
    banner: category.banner?.trim() || undefined,
    sortOrder: Math.max(
      Math.floor(
        Number(category.sortOrder) || 0
      ),
      0
    ),
    featured: category.featured ?? false,
    showOnHome: category.showOnHome ?? false,

homeLayout:
  category.homeLayout === "slider"
    ? "slider"
    : "grid",

displayOrder: Math.max(
  Math.floor(
    Number(category.displayOrder) || 0
  ),
  0
),
  };
  
}



export default function CategoryAdminProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [hydrated, setHydrated] =
    useState(false);

  useEffect(() => {
    setCategories(readStoredCategories());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(categories)
      );
    } catch {
      // Local storage failure should not break the app.
    }
  }, [categories, hydrated]);

  const activeCategories = useMemo(
    () =>
      categories
        .filter(
          (category) => category.active
        )
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder
        ),
    [categories]
  );

  const getCategoryById = useCallback(
    (categoryId: string) =>
      categories.find(
        (category) =>
          category.id === categoryId
      ),
    [categories]
  );

  const getCategoryBySlug =
    useCallback(
      (
        slug: string,
        includeInactive = false
      ) =>
        categories.find(
          (category) =>
            category.slug === slug &&
            (includeInactive ||
              category.active)
        ),
      [categories]
    );

  const addCategory = useCallback(
    (input: CategoryInput) => {
      let createdCategory:
        | Category
        | null = null;

      setCategories((current) => {
        const categoryId =
          input.id?.trim() ||
          createCategoryId();

        const slug = createUniqueSlug(
          input.slug || input.name,
          current
        );

       createdCategory =
  sanitizeCategory({
    ...input,
    id: categoryId,
    slug,

    featured: input.featured ?? false,
    showOnHome: input.showOnHome ?? false,
    homeLayout: input.homeLayout ?? "grid",
    displayOrder: input.displayOrder ?? 0,

  } as Category);

        return [
          createdCategory,
          ...current.filter(
            (category) =>
              category.id !== categoryId
          ),
        ];
      });

      if (!createdCategory) {
        throw new Error(
          "Category could not be created."
        );
      }

      return createdCategory;
    },
    []
  );

  const updateCategory = useCallback(
    (
      categoryId: string,
      updates: Partial<Category>
    ) => {
      let updatedCategory:
        | Category
        | null = null;

      setCategories((current) =>
        current.map((category) => {
          if (
            category.id !== categoryId
          ) {
            return category;
          }

          const requestedSlug =
            updates.slug ??
            updates.name ??
            category.slug;

          const slug = createUniqueSlug(
            requestedSlug,
            current,
            categoryId
          );

          updatedCategory =
            sanitizeCategory({
              ...category,
              ...updates,
              id: category.id,
              slug,
            });

          return updatedCategory;
        })
      );

      return updatedCategory;
    },
    []
  );

  const removeCategory = useCallback(
    (categoryId: string) => {
      setCategories((current) =>
        current.filter(
          (category) =>
            category.id !== categoryId
        )
      );
    },
    []
  );

  const toggleCategoryActive =
    useCallback((categoryId: string) => {
      setCategories((current) =>
        current.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                active: !category.active,
              }
            : category
        )
      );
    }, []);

  const resetCategories = useCallback(() => {
    setCategories(
      cloneDefaultCategories()
    );
  }, []);

  const value =
    useMemo<CategoryAdminContextValue>(
      () => ({
        categories,
        activeCategories,
        hydrated,
        getCategoryById,
        getCategoryBySlug,
        addCategory,
        updateCategory,
        removeCategory,
        toggleCategoryActive,
        resetCategories,
      }),
      [
        categories,
        activeCategories,
        hydrated,
        getCategoryById,
        getCategoryBySlug,
        addCategory,
        updateCategory,
        removeCategory,
        toggleCategoryActive,
        resetCategories,
      ]
    );

  return (
    <CategoryAdminContext.Provider
      value={value}
    >
      {children}
    </CategoryAdminContext.Provider>
  );
}
