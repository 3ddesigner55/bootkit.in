"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Grid2X2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import type { Category } from "@/types/category";

type CategoryFilter = "All" | "Active" | "Inactive";

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  background: string;
  sortOrder: string;
  active: boolean;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  icon: "📦",
  background: "#F2F5EF",
  sortOrder: "1",
  active: true,
};

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryToForm(category: Category): CategoryForm {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    background: category.background,
    sortOrder: String(category.sortOrder),
    active: category.active,
  };
}

export default function AdminCategoriesClient() {
  const {
    categories,
    hydrated,
    addCategory,
    updateCategory,
    removeCategory,
    toggleCategoryActive,
    resetCategories,
  } = useAdminCategories();

  const {
    products,
    hydrated: productsHydrated,
  } = useAdminProducts();

  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<CategoryFilter>("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [form, setForm] =
    useState<CategoryForm>(emptyForm);

  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const categoryProductCounts = useMemo(() => {
    return products.reduce<Record<string, number>>(
      (counts, product) => {
        counts[product.categorySlug] =
          (counts[product.categorySlug] ?? 0) + 1;

        return counts;
      },
      {}
    );
  }, [products]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...categories]
      .filter((category) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            category.name,
            category.slug,
            category.description,
          ].some((value) =>
            value.toLowerCase().includes(normalizedQuery)
          );

        const matchesFilter =
          filter === "All" ||
          (filter === "Active" && category.active) ||
          (filter === "Inactive" && !category.active);

        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories, query, filter]);

  const stats = useMemo(
    () => ({
      total: categories.length,
      active: categories.filter(
        (category) => category.active
      ).length,
      inactive: categories.filter(
        (category) => !category.active
      ).length,
      assignedProducts: products.filter((product) =>
        categories.some(
          (category) =>
            category.slug === product.categorySlug
        )
      ).length,
    }),
    [categories, products]
  );

  const openAddForm = () => {
    const nextSortOrder =
      categories.length > 0
        ? Math.max(
            ...categories.map(
              (category) => category.sortOrder
            )
          ) + 1
        : 1;

    setEditingCategory(null);
    setForm({
      ...emptyForm,
      sortOrder: String(nextSortOrder),
    });
    setSlugEdited(false);
    setError("");
    setMessage("");
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setForm(categoryToForm(category));
    setSlugEdited(true);
    setError("");
    setMessage("");
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingCategory(null);
    setForm(emptyForm);
    setSlugEdited(false);
    setError("");
  };

  const updateField = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === "sortOrder") {
      nextValue = value.replace(/\D/g, "");
    }

    if (name === "slug") {
      setSlugEdited(true);
      nextValue = createSlug(value);
    }

    setForm((current) => {
      const updated = {
        ...current,
        [name]: nextValue,
      };

      if (name === "name" && !slugEdited) {
        updated.slug = createSlug(nextValue);
      }

      return updated;
    });

    setError("");
    setMessage("");
  };

  const validateForm = () => {
    if (form.name.trim().length < 2) {
      return "Please enter a valid category name.";
    }

    if (!form.slug.trim()) {
      return "Please enter a category slug.";
    }

    if (form.description.trim().length < 5) {
      return "Description must contain at least 5 characters.";
    }

    if (!form.icon.trim()) {
      return "Please enter a category icon.";
    }

    if (
      !/^#[0-9A-Fa-f]{6}$/.test(
        form.background.trim()
      )
    ) {
      return "Background must be a valid hex color, for example #E8F5E4.";
    }

    const sortOrder = Number(form.sortOrder);

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return "Sort order must be a valid whole number.";
    }

    return "";
  };

  const saveCategory = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const categoryData = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      icon: form.icon.trim(),
      background: form.background.trim(),
      sortOrder: Number(form.sortOrder),
      active: form.active,
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        ...categoryData,
        productCount:
          categoryProductCounts[
            editingCategory.slug
          ] ?? 0,
      });

      setMessage(
        `${categoryData.name} updated successfully.`
      );
    } else {
      addCategory({
        ...categoryData,
        productCount: 0,
      });

      setMessage(
        `${categoryData.name} added successfully.`
      );
    }

    closeForm();

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const confirmDeleteCategory = (
    category: Category
  ) => {
    const assignedProducts =
      categoryProductCounts[category.slug] ?? 0;

    if (assignedProducts > 0) {
      window.alert(
        `This category contains ${assignedProducts} product${
          assignedProducts === 1 ? "" : "s"
        }. Move or delete those products first.`
      );

      return;
    }

    const confirmed = window.confirm(
      `Delete "${category.name}" permanently from local categories?`
    );

    if (!confirmed) return;

    removeCategory(category.id);

    if (editingCategory?.id === category.id) {
      closeForm();
    }

    setMessage(
      `${category.name} deleted successfully.`
    );

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const confirmReset = () => {
    const confirmed = window.confirm(
      "Reset all category changes and restore default categories?"
    );

    if (!confirmed) return;

    resetCategories();
    closeForm();
    setMessage("Default categories restored.");

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  if (!hydrated || !productsHydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />

        <Container className="py-6">
          <div className="h-[620px] animate-pulse rounded-[28px] bg-white" />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/admin"
                aria-label="Back to admin"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
              >
                <ArrowLeft size={19} />
              </Link>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--primary)]">
                  Local admin
                </p>

                <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                  Category management
                </h1>

                <p className="text-xs text-[var(--text-muted)]">
                  Add, edit and control store categories
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddForm}
                className="flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 text-[11px] font-black text-white"
              >
                <Plus size={15} />
                Add
              </button>

              <button
                type="button"
                onClick={confirmReset}
                className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-[11px] font-black text-[var(--danger)]"
              >
                <RefreshCw size={15} />
                Reset
              </button>
            </div>
          </div>

          {message && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
              <CheckCircle2 size={16} />
              {message}
            </div>
          )}

          {formOpen && (
            <section className="mb-5 rounded-[26px] border border-[var(--primary)] bg-white p-4 shadow-[var(--shadow-md)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--primary)]">
                    {editingCategory
                      ? "Editing category"
                      : "New category"}
                  </p>

                  <h2 className="mt-1 text-xl font-black text-[var(--text-primary)]">
                    {editingCategory
                      ? editingCategory.name
                      : "Add category"}
                  </h2>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Category changes are stored locally.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close form"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-muted)]"
                >
                  <X size={17} />
                </button>
              </div>

              <form
                onSubmit={saveCategory}
                className="mt-6"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <CategoryField
                    label="Category name"
                    name="name"
                    value={form.name}
                    placeholder="Fruits & Vegetables"
                    onChange={updateField}
                    required
                  />

                  <CategoryField
                    label="Slug"
                    name="slug"
                    value={form.slug}
                    placeholder="fruits-vegetables"
                    onChange={updateField}
                    required
                  />

                  <CategoryField
                    label="Icon"
                    name="icon"
                    value={form.icon}
                    placeholder="🥦"
                    onChange={updateField}
                    required
                  />

                  <CategoryField
                    label="Background color"
                    name="background"
                    value={form.background}
                    placeholder="#E8F5E4"
                    onChange={updateField}
                    required
                  />

                  <CategoryField
                    label="Sort order"
                    name="sortOrder"
                    value={form.sortOrder}
                    placeholder="1"
                    inputMode="numeric"
                    onChange={updateField}
                    required
                  />

                  <label className="flex items-end">
                    <span className="flex h-12 w-full items-center justify-between rounded-xl bg-[var(--surface-soft)] px-4">
                      <span>
                        <span className="block text-xs font-black text-[var(--text-primary)]">
                          Active category
                        </span>

                        <span className="text-[9px] text-[var(--text-muted)]">
                          Visible to customers
                        </span>
                      </span>

                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            active:
                              event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                    </span>
                  </label>

                  <label className="block sm:col-span-2 lg:col-span-3">
                    <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                      Description
                      <span className="ml-1 text-[var(--danger)]">
                        *
                      </span>
                    </span>

                    <textarea
                      name="description"
                      value={form.description}
                      onChange={updateField}
                      rows={4}
                      placeholder="Category description"
                      className="w-full resize-none rounded-xl border border-[var(--border)] bg-white p-4 text-sm font-semibold outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                    />
                  </label>
                </div>

                <div className="mt-5 flex items-center gap-4 rounded-2xl border border-[var(--border)] p-4">
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-[18px] text-[36px]"
                    style={{
                      backgroundColor:
                        form.background ||
                        "#F2F5EF",
                    }}
                  >
                    {form.icon || "📦"}
                  </span>

                  <div>
                    <p className="text-sm font-black text-[var(--text-primary)]">
                      {form.name ||
                        "Category preview"}
                    </p>

                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      /category/
                      {form.slug || "category-slug"}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-sm font-black text-white"
                  >
                    <Save size={17} />
                    {editingCategory
                      ? "Update category"
                      : "Save category"}
                  </button>

                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-[var(--border)] text-sm font-black text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total categories"
              value={stats.total.toString()}
            />

            <StatCard
              label="Active"
              value={stats.active.toString()}
            />

            <StatCard
              label="Inactive"
              value={stats.inactive.toString()}
            />

            <StatCard
              label="Assigned products"
              value={stats.assignedProducts.toString()}
            />
          </section>

          <section className="mt-5 rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
              <label className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3">
                <Search
                  size={17}
                  className="text-[var(--text-muted)]"
                />

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder="Search category"
                  className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"
                />
              </label>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(
                    event.target
                      .value as CategoryFilter
                  )
                }
                className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold outline-none"
              >
                <option value="All">
                  All categories
                </option>
                <option value="Active">
                  Active
                </option>
                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          </section>

          {filteredCategories.length === 0 ? (
            <section className="mt-5 flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white text-center">
              <Grid2X2
                size={38}
                className="text-[var(--text-muted)]"
              />

              <h2 className="mt-4 text-xl font-black text-[var(--text-primary)]">
                No matching categories
              </h2>
            </section>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCategories.map(
                (category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    productCount={
                      categoryProductCounts[
                        category.slug
                      ] ?? 0
                    }
                    onEdit={() =>
                      openEditForm(category)
                    }
                    onToggleActive={() =>
                      toggleCategoryActive(
                        category.id
                      )
                    }
                    onDelete={() =>
                      confirmDeleteCategory(
                        category
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

function CategoryCard({
  category,
  productCount,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  category: Category;
  productCount: number;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-[24px] border bg-white shadow-[var(--shadow-sm)] ${
        category.active
          ? "border-[var(--border)]"
          : "border-red-200 opacity-80"
      }`}
    >
      <div className="flex items-start gap-4 p-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] text-[34px]"
          style={{
            backgroundColor:
              category.background,
          }}
        >
          {category.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-black text-[var(--text-primary)]">
                {category.name}
              </h2>

              <p className="mt-1 truncate text-[10px] text-[var(--primary)]">
                {category.slug}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                category.active
                  ? "bg-green-50 text-[var(--success)]"
                  : "bg-red-50 text-[var(--danger)]"
              }`}
            >
              {category.active
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-[var(--text-secondary)]">
            {category.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-[var(--border)] border-y border-[var(--border)] bg-[var(--surface-soft)]">
        <div className="p-3 text-center">
          <p className="text-sm font-black text-[var(--text-primary)]">
            {productCount}
          </p>

          <p className="mt-1 text-[9px] text-[var(--text-muted)]">
            Products
          </p>
        </div>

        <div className="p-3 text-center">
          <p className="text-sm font-black text-[var(--text-primary)]">
            {category.sortOrder}
          </p>

          <p className="mt-1 text-[9px] text-[var(--text-muted)]">
            Sort order
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--primary)] text-[10px] font-black text-[var(--primary)]"
        >
          <Pencil size={14} />
          Edit
        </button>

        <button
          type="button"
          onClick={onToggleActive}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[10px] font-black ${
            category.active
              ? "bg-amber-50 text-amber-700"
              : "bg-green-50 text-[var(--success)]"
          }`}
        >
          {category.active ? (
            <EyeOff size={14} />
          ) : (
            <Eye size={14} />
          )}

          {category.active
            ? "Disable"
            : "Enable"}
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-[10px] font-black text-[var(--danger)]"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[20px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
        <Grid2X2 size={19} />
      </span>

      <p className="mt-4 text-xl font-black text-[var(--text-primary)]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-bold text-[var(--text-muted)]">
        {label}
      </p>
    </article>
  );
}

type CategoryFieldProps = {
  label: string;
  name: keyof CategoryForm;
  value: string;
  placeholder: string;
  required?: boolean;
  inputMode?: "text" | "numeric";
  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

function CategoryField({
  label,
  name,
  value,
  placeholder,
  required = false,
  inputMode = "text",
  onChange,
}: CategoryFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
        {label}

        {required && (
          <span className="ml-1 text-[var(--danger)]">
            *
          </span>
        )}
      </span>

      <input
        type="text"
        name={name}
        value={value}
        required={required}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={onChange}
        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
      />
    </label>
  );
}