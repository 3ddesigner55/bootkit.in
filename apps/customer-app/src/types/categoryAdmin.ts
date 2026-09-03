import type { Category } from "@/types/category";

export type CategoryInput = Omit<Category, "id"> & {
  id?: string;
};

export type CategoryAdminContextValue = {
  categories: Category[];
  activeCategories: Category[];
  hydrated: boolean;

  getCategoryById: (
    categoryId: string
  ) => Category | undefined;

  getCategoryBySlug: (
    slug: string,
    includeInactive?: boolean
  ) => Category | undefined;

  addCategory: (
    input: CategoryInput
  ) => Category;

  updateCategory: (
    categoryId: string,
    updates: Partial<Category>
  ) => Category | null;

  removeCategory: (
    categoryId: string
  ) => void;

  toggleCategoryActive: (
    categoryId: string
  ) => void;

  resetCategories: () => void;
};