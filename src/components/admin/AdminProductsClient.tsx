"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  Eye,
  EyeOff,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Star,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { getActiveCategories } from "@/data/categories";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";

type ProductFilter =
  | "All"
  | "Active"
  | "Inactive"
  | "Low Stock"
  | "Featured"
  | "Bestseller";

type ProductEditForm = {
  name: string;
  brand: string;
  categorySlug: string;
  fallbackIcon: string;
  unitLabel: string;
  unitValue: string;
  mrp: string;
  price: string;
  stock: string;
  deliveryMinutes: string;
  active: boolean;
  featured: boolean;
  bestseller: boolean;
};

function productToForm(product: Product): ProductEditForm {
  return {
    name: product.name,
    brand: product.brand,
    categorySlug: product.categorySlug,
    fallbackIcon: product.fallbackIcon,
    unitLabel: product.unit.label,
    unitValue: product.unit.value,
    mrp: String(product.mrp),
    price: String(product.price),
    stock: String(product.stock),
    deliveryMinutes: String(product.deliveryMinutes),
    active: product.active,
    featured: product.featured,
    bestseller: product.bestseller,
  };
}

export default function AdminProductsClient() {
  const {
  products,
  hydrated,
  updateProduct,
  removeProduct,
  toggleProductActive,
  toggleProductFeatured,
  toggleProductBestseller,
  resetProducts,
} = useAdminProducts();

  const categories = getActiveCategories();

  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<ProductFilter>("All");

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductEditForm | null>(null);

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          product.name,
          product.brand,
          product.slug,
          product.categorySlug,
          product.unit.label,
        ].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );

      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && product.active) ||
        (filter === "Inactive" && !product.active) ||
        (filter === "Low Stock" && product.stock <= 10) ||
        (filter === "Featured" && product.featured) ||
        (filter === "Bestseller" && product.bestseller);

      return matchesQuery && matchesFilter;
    });
  }, [products, query, filter]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((product) => product.active).length,
      lowStock: products.filter(
        (product) => product.stock <= 10
      ).length,
      inventoryValue: products.reduce(
        (total, product) =>
          total + product.price * product.stock,
        0
      ),
    };
  }, [products]);

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setForm(productToForm(product));
    setFormError("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeEditForm = () => {
    setEditingProduct(null);
    setForm(null);
    setFormError("");
  };

  const updateTextField = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!form) return;

    const { name, value } = event.target;

    let nextValue = value;

    if (
      name === "mrp" ||
      name === "price" ||
      name === "stock" ||
      name === "deliveryMinutes"
    ) {
      nextValue = value.replace(/[^\d.]/g, "");
    }

    setForm((current) =>
      current
        ? {
            ...current,
            [name]: nextValue,
          }
        : current
    );

    setFormError("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    if (!form) return "Product form is unavailable.";

    if (form.name.trim().length < 2) {
      return "Please enter a valid product name.";
    }

    if (form.brand.trim().length < 2) {
      return "Please enter a valid brand name.";
    }

    if (!form.categorySlug) {
      return "Please select a category.";
    }

    if (!form.unitLabel.trim()) {
      return "Please enter a product unit.";
    }

    const mrp = Number(form.mrp);
    const price = Number(form.price);
    const stock = Number(form.stock);
    const deliveryMinutes = Number(form.deliveryMinutes);

    if (!Number.isFinite(mrp) || mrp <= 0) {
      return "MRP must be greater than zero.";
    }

    if (!Number.isFinite(price) || price < 0) {
      return "Selling price cannot be negative.";
    }

    if (price > mrp) {
      return "Selling price cannot be higher than MRP.";
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return "Stock must be a valid whole number.";
    }

    if (
      !Number.isInteger(deliveryMinutes) ||
      deliveryMinutes < 1
    ) {
      return "Delivery time must be at least 1 minute.";
    }

    return "";
  };

  const saveProduct = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editingProduct || !form) return;

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    updateProduct(editingProduct.id, {
      name: form.name.trim(),
      brand: form.brand.trim(),
      categorySlug: form.categorySlug,
      fallbackIcon: form.fallbackIcon.trim() || "📦",
      unit: {
        label: form.unitLabel.trim(),
        value:
          form.unitValue.trim() ||
          form.unitLabel
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-"),
      },
      mrp: Number(form.mrp),
      price: Number(form.price),
      stock: Number(form.stock),
      deliveryMinutes: Number(form.deliveryMinutes),
      active: form.active,
      featured: form.featured,
      bestseller: form.bestseller,
    });

    setSuccessMessage(
      `${form.name.trim()} updated successfully.`
    );

    setEditingProduct(null);
    setForm(null);
    setFormError("");

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

const confirmDeleteProduct = (product: Product) => {
  const confirmed = window.confirm(
    `Delete "${product.name}" permanently from local inventory?`
  );

  if (!confirmed) return;

  removeProduct(product.id);

  if (editingProduct?.id === product.id) {
    closeEditForm();
  }

  setSuccessMessage(
    `${product.name} deleted successfully.`
  );

  window.setTimeout(() => {
    setSuccessMessage("");
  }, 3000);
};

  const confirmResetProducts = () => {
    const confirmed = window.confirm(
      "Reset all local product changes and restore default products?"
    );

    if (!confirmed) return;

    resetProducts();
    closeEditForm();
    setSuccessMessage("Default products restored.");

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/admin"
                aria-label="Back to admin dashboard"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
              >
                <ArrowLeft size={19} />
              </Link>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--primary)]">
                  Local admin
                </p>

                <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                  Product management
                </h1>

                <p className="text-xs text-[var(--text-muted)]">
                  Manage product prices, stock and visibility
                </p>
              </div>
            </div>

            <Link
  href="/admin/products/new"
  className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 text-[11px] font-black text-white"
>
  <Plus size={15} />
  Add product
</Link>

            <button
              type="button"
              onClick={confirmResetProducts}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-[11px] font-black text-[var(--danger)]"
            >
              <RefreshCw size={15} />
              Reset
            </button>
          </div>

          {successMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
              <CheckCircle2 size={16} />
              {successMessage}
            </div>
          )}

          {editingProduct && form && (
            <section className="mb-5 rounded-[26px] border border-[var(--primary)] bg-white p-4 shadow-[var(--shadow-md)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--primary)]">
                    Editing product
                  </p>

                  <h2 className="mt-1 text-xl font-black tracking-[-0.035em] text-[var(--text-primary)]">
                    {editingProduct.name}
                  </h2>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Changes will be saved locally on this device.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditForm}
                  aria-label="Close product editor"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-muted)]"
                >
                  <X size={17} />
                </button>
              </div>

              <form
                onSubmit={saveProduct}
                className="mt-6"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AdminField
                    label="Product name"
                    name="name"
                    value={form.name}
                    onChange={updateTextField}
                    placeholder="Product name"
                    required
                  />

                  <AdminField
                    label="Brand"
                    name="brand"
                    value={form.brand}
                    onChange={updateTextField}
                    placeholder="Brand name"
                    required
                  />

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                      Category
                      <span className="ml-1 text-[var(--danger)]">
                        *
                      </span>
                    </span>

                    <select
                      name="categorySlug"
                      value={form.categorySlug}
                      onChange={updateTextField}
                      required
                      className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">
                        Select category
                      </option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.slug}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <AdminField
                    label="Product icon"
                    name="fallbackIcon"
                    value={form.fallbackIcon}
                    onChange={updateTextField}
                    placeholder="📦"
                  />

                  <AdminField
                    label="Unit label"
                    name="unitLabel"
                    value={form.unitLabel}
                    onChange={updateTextField}
                    placeholder="1 kg"
                    required
                  />

                  <AdminField
                    label="Unit value"
                    name="unitValue"
                    value={form.unitValue}
                    onChange={updateTextField}
                    placeholder="1-kg"
                  />

                  <AdminField
                    label="MRP"
                    name="mrp"
                    value={form.mrp}
                    onChange={updateTextField}
                    placeholder="0"
                    inputMode="decimal"
                    required
                  />

                  <AdminField
                    label="Selling price"
                    name="price"
                    value={form.price}
                    onChange={updateTextField}
                    placeholder="0"
                    inputMode="decimal"
                    required
                  />

                  <AdminField
                    label="Stock quantity"
                    name="stock"
                    value={form.stock}
                    onChange={updateTextField}
                    placeholder="0"
                    inputMode="numeric"
                    required
                  />

                  <AdminField
                    label="Delivery minutes"
                    name="deliveryMinutes"
                    value={form.deliveryMinutes}
                    onChange={updateTextField}
                    placeholder="15"
                    inputMode="numeric"
                    required
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <AdminToggle
                    label="Active product"
                    description="Visible to customers"
                    checked={form.active}
                    onChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              active: checked,
                            }
                          : current
                      )
                    }
                  />

                  <AdminToggle
                    label="Featured"
                    description="Show in featured section"
                    checked={form.featured}
                    onChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              featured: checked,
                            }
                          : current
                      )
                    }
                  />

                  <AdminToggle
                    label="Bestseller"
                    description="Show bestseller badge"
                    checked={form.bestseller}
                    onChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              bestseller: checked,
                            }
                          : current
                      )
                    }
                  />
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]"
                  >
                    {formError}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-sm font-black text-white"
                  >
                    <Save size={17} />
                    Save product
                  </button>

                  <button
                    type="button"
                    onClick={closeEditForm}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] text-sm font-black text-[var(--text-secondary)]"
                  >
                    <X size={17} />
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={Boxes}
              label="Total products"
              value={stats.total.toString()}
            />

            <StatCard
              icon={Eye}
              label="Active"
              value={stats.active.toString()}
            />

            <StatCard
              icon={Package}
              label="Low stock"
              value={stats.lowStock.toString()}
            />

            <StatCard
              icon={TrendingUp}
              label="Inventory value"
              value={formatPrice(stats.inventoryValue)}
            />
          </section>

          <section className="mt-5 rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_210px]">
              <label className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 focus-within:border-[var(--primary)]">
                <Search
                  size={17}
                  className="shrink-0 text-[var(--text-muted)]"
                />

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder="Search product, brand or category"
                  className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"
                />
              </label>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(
                    event.target.value as ProductFilter
                  )
                }
                className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--text-primary)] outline-none"
              >
                <option value="All">All products</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Low Stock">Low stock</option>
                <option value="Featured">Featured</option>
                <option value="Bestseller">Bestseller</option>
              </select>
            </div>
          </section>

          {!hydrated ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-72 animate-pulse rounded-[24px] bg-white"
                  />
                )
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <section className="mt-5 flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center">
              <Boxes
                size={38}
                className="text-[var(--text-muted)]"
              />

              <h2 className="mt-4 text-xl font-black text-[var(--text-primary)]">
                No matching products
              </h2>

              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Try another search or product filter.
              </p>
            </section>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <AdminProductCard
  key={product.id}
  product={product}
  onEdit={() => openEditForm(product)}
  onDelete={() =>
    confirmDeleteProduct(product)
  }
  onToggleActive={() =>
    toggleProductActive(product.id)
  }
  onToggleFeatured={() =>
    toggleProductFeatured(product.id)
  }
  onToggleBestseller={() =>
    toggleProductBestseller(product.id)
  }
/>
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

function AdminProductCard({
  product,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
  onToggleBestseller,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onToggleFeatured: () => void;
  onToggleBestseller: () => void;
}) {
  const lowStock = product.stock <= 10;

  return (
    <article
      className={`overflow-hidden rounded-[24px] border bg-white shadow-[var(--shadow-sm)] ${
        product.active
          ? "border-[var(--border)]"
          : "border-red-200 opacity-80"
      }`}
    >
      <div className="flex items-start gap-4 p-4">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[18px] bg-[var(--surface-soft)] text-[45px]">
          {product.fallbackIcon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.08em] text-[var(--primary)]">
                {product.brand}
              </p>

              <h2 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-[var(--text-primary)]">
                {product.name}
              </h2>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black ${
                product.active
                  ? "bg-green-50 text-[var(--success)]"
                  : "bg-red-50 text-[var(--danger)]"
              }`}
            >
              {product.active ? "Active" : "Inactive"}
            </span>
          </div>

          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            {product.unit.label} · {product.categorySlug}
          </p>

          <div className="mt-3 flex items-end gap-2">
            <span className="text-base font-black text-[var(--text-primary)]">
              {formatPrice(product.price)}
            </span>

            {product.mrp > product.price && (
              <span className="text-[10px] text-[var(--text-muted)] line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-y border-[var(--border)] bg-[var(--surface-soft)]">
        <ProductMetric
          label="Stock"
          value={product.stock.toString()}
          warning={lowStock}
        />

        <ProductMetric
          label="Rating"
          value={product.rating.toFixed(1)}
        />

        <ProductMetric
          label="Delivery"
          value={`${product.deliveryMinutes}m`}
        />
      </div>

      <div className="flex flex-wrap gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onToggleFeatured}
          className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-black ${
            product.featured
              ? "bg-blue-50 text-blue-700"
              : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
          }`}
        >
          <Star
            size={12}
            fill={
              product.featured ? "currentColor" : "none"
            }
          />
          Featured
        </button>

        <button
          type="button"
          onClick={onToggleBestseller}
          className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-black ${
            product.bestseller
              ? "bg-amber-50 text-amber-700"
              : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
          }`}
        >
          <BadgeCheck size={12} />
          Bestseller
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[var(--border)] p-4 sm:grid-cols-4">
        <Link
          href={`/product/${product.slug}`}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] text-[10px] font-black text-[var(--text-secondary)]"
        >
          <Eye size={14} />
          View
        </Link>

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
            product.active
              ? "bg-red-50 text-[var(--danger)]"
              : "bg-green-50 text-[var(--success)]"
          }`}
        >
          {product.active ? (
            <EyeOff size={14} />
          ) : (
            <Eye size={14} />
          )}

          {product.active ? "Disable" : "Enable"}
        </button>

        <button
  type="button"
  onClick={onDelete}
  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 text-[10px] font-black text-[var(--danger)]"
>
  <Trash2 size={14} />
  Delete
</button>
      </div>
    </article>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[20px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
        <Icon size={19} />
      </span>

      <p className="mt-4 text-xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-bold text-[var(--text-muted)]">
        {label}
      </p>
    </article>
  );
}

function ProductMetric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="p-3 text-center">
      <p
        className={`text-sm font-black ${
          warning
            ? "text-[var(--danger)]"
            : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[9px] font-bold text-[var(--text-muted)]">
        {label}
      </p>
    </div>
  );
}

type AdminFieldProps = {
  label: string;
  name: keyof ProductEditForm;
  value: string;
  placeholder: string;
  required?: boolean;
  inputMode?: "text" | "numeric" | "decimal";
  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

function AdminField({
  label,
  name,
  value,
  placeholder,
  required = false,
  inputMode = "text",
  onChange,
}: AdminFieldProps) {
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
        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:font-normal placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
      />
    </label>
  );
}

function AdminToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--surface-soft)] p-4">
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black text-[var(--text-primary)]">
          {label}
        </span>

        <span className="mt-1 block text-[9px] leading-4 text-[var(--text-muted)]">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="peer sr-only"
      />

      <span className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--surface-muted)] transition peer-checked:bg-[var(--primary)]">
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}