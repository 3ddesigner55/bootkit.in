"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  PackagePlus,
  Save,
} from "lucide-react";
import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { getActiveCategories } from "@/data/categories";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { useAdminBrands } from "@/hooks/useAdminBrands";

type VariantForm = {
  id: string;
  color: string;
  size: string;
  weight: string;
  sku: string;
  barcode: string;
  image: string;
  mrp: string;
  price: string;
  stock: string;
};

type ProductForm = {
  images: string[];
  tags: string;
  variants: VariantForm[];
  name: string;
  slug: string;
  brand: string;
  categorySlug: string;
  image: string;
  fallbackIcon: string;
  unitLabel: string;
  unitValue: string;
  mrp: string;
  price: string;
  stock: string;
  deliveryMinutes: string;
  featured: boolean;
  bestseller: boolean;
  active: boolean;
};

const initialForm: ProductForm = {
  images: [],
  tags: "",
  variants: [],
  name: "",
  slug: "",
  brand: "",
  categorySlug: "",
  image: "",
  fallbackIcon: "📦",
  unitLabel: "",
  unitValue: "",
  mrp: "",
  price: "",
  stock: "",
  deliveryMinutes: "15",
  featured: false,
  bestseller: false,
  active: true,
};

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function newVariant(): VariantForm {
  return {
    id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    color: "",
    size: "",
    weight: "",
    sku: "",
    barcode: "",
    image: "",
    mrp: "",
    price: "",
    stock: "",
  };
}

export default function AddProductPage() {
  const router = useRouter();

  const {
    addProduct,
    hydrated,
  } = useAdminProducts();

  const categories = getActiveCategories();
  const { activeBrands } = useAdminBrands();

  const [form, setForm] =
    useState<ProductForm>(initialForm);

  const [slugEdited, setSlugEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    let nextValue = value;

    if (
      name === "mrp" ||
      name === "price"
    ) {
      nextValue = value.replace(/[^\d.]/g, "");
    }

    if (
      name === "stock" ||
      name === "deliveryMinutes"
    ) {
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

      if (
        name === "unitLabel" &&
        !current.unitValue
      ) {
        updated.unitValue = createSlug(nextValue);
      }

      return updated;
    });

    setError("");
    setSuccess("");
  };

  const validateForm = () => {
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
      return "Please enter the product unit.";
    }

    const mrp = Number(form.mrp);
    const price = Number(form.price);
    const stock = Number(form.stock);
    const deliveryMinutes = Number(
      form.deliveryMinutes
    );

    if (!Number.isFinite(mrp) || mrp <= 0) {
      return "MRP must be greater than zero.";
    }

    if (!Number.isFinite(price) || price < 0) {
      return "Selling price cannot be negative.";
    }

    if (price > mrp) {
      return "Selling price cannot be greater than MRP.";
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

  const updateVariant = (
    id: string,
    field: keyof VariantForm,
    value: string
  ) => {
    const numericField = ["mrp", "price", "stock"].includes(field);
    const nextValue = numericField
      ? value.replace(field === "stock" ? /\D/g : /[^\d.]/g, "")
      : value;

    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === id ? { ...variant, [field]: nextValue } : variant
      ),
    }));
    setError("");
  };

  const submitProduct = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    for (const variant of form.variants) {
      if (!variant.sku.trim()) {
        setError("हर variant के लिए SKU आवश्यक है।");
        return;
      }

      if (Number(variant.price) > Number(variant.mrp)) {
        setError("Variant का selling price MRP से अधिक नहीं हो सकता।");
        return;
      }
    }

    setSubmitting(true);

    try {
      const product = addProduct({
        name: form.name.trim(),
        slug:
          form.slug.trim() ||
          createSlug(form.name),
        brand: form.brand.trim(),
        categorySlug: form.categorySlug,
        image: form.image.trim(),
        images:
  form.images.length > 0
    ? form.images.filter((img) => img.trim() !== "")
    : form.image.trim()
    ? [form.image.trim()]
    : [],
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        variants: form.variants.map((variant, index) => ({
          id: variant.id,
          name: [variant.color, variant.size, variant.weight].filter(Boolean).join(" · ") || `Variant ${index + 1}`,
          sku: variant.sku.trim(),
          barcode: variant.barcode.trim() || undefined,
          color: variant.color.trim() || undefined,
          size: variant.size.trim() || undefined,
          weight: variant.weight.trim() || undefined,
          image: variant.image.trim() || undefined,
          images: variant.image.trim() ? [variant.image.trim()] : [],
          attributes: Object.fromEntries(
            [["Color", variant.color], ["Size", variant.size], ["Weight", variant.weight]]
              .filter(([, value]) => value.trim())
          ),
          unit: {
            label: variant.weight.trim() || form.unitLabel.trim(),
            value: createSlug(variant.weight || form.unitValue || form.unitLabel),
          },
          mrp: Number(variant.mrp || form.mrp),
          price: Number(variant.price || form.price),
          stock: Number(variant.stock || 0),
          active: true,
        })),
        fallbackIcon:
          form.fallbackIcon.trim() || "📦",
        unit: {
          label: form.unitLabel.trim(),
          value:
            form.unitValue.trim() ||
            createSlug(form.unitLabel),
        },
        mrp: Number(form.mrp),
        price: Number(form.price),
        stock: Number(form.stock),
        rating: 0,
        reviewCount: 0,
        deliveryMinutes: Number(
          form.deliveryMinutes
        ),
        featured: form.featured,
        bestseller: form.bestseller,
        active: form.active,
      });

      setSuccess(
        `${product.name} added successfully.`
      );

      window.setTimeout(() => {
        router.push("/admin/products");
      }, 900);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Product could not be added."
      );

      setSubmitting(false);
    }
  };

  if (!hydrated) {
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
          <div className="mb-5 flex items-center gap-3">
            <Link
              href="/admin/products"
              aria-label="Back to products"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--primary)]">
                Local admin
              </p>

              <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                Add new product
              </h1>

              <p className="text-xs text-[var(--text-muted)]">
                Create a product in local inventory
              </p>
            </div>
          </div>

          <form
            onSubmit={submitProduct}
            className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--primary-light)] text-[var(--primary)]">
                <PackagePlus size={22} />
              </span>

              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)]">
                  Product information
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Required fields are marked with *
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ProductField
                label="Product name"
                name="name"
                value={form.name}
                placeholder="Fresh Milk"
                onChange={updateField}
                required
              />

              <ProductField
                label="Tags (comma separated)"
                name="tags"
                value={form.tags}
                placeholder="organic, popular, dairy"
                onChange={updateField}
              />

              <ProductField
                label="Product slug"
                name="slug"
                value={form.slug}
                placeholder="fresh-milk"
                onChange={updateField}
                required
              />

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">Brand<span className="ml-1 text-[var(--danger)]">*</span></span>
                <select name="brand" value={form.brand} onChange={updateField} required className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]">
                  <option value="">Select brand</option>
                  {activeBrands.map((brand) => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
                </select>
              </label>

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
                  onChange={updateField}
                  required
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
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

              <ProductField
                label="Product icon"
                name="fallbackIcon"
                value={form.fallbackIcon}
                placeholder="📦"
                onChange={updateField}
              />

              <ProductField
                label="Image path or URL"
                name="image"
                value={form.image}
                placeholder="/products/item.png"
                onChange={updateField}
              />

              <div className="sm:col-span-2 lg:col-span-3">
  <p className="mb-3 text-sm font-bold">
    Gallery Images
  </p>

  {[0, 1, 2, 3, 4].map((index) => (
    <input
      key={index}
      type="text"
      placeholder={`Image ${index + 1}`}
      value={form.images[index] || ""}
      onChange={(e) => {
        const images = [...form.images];
        images[index] = e.target.value;

        setForm((prev) => ({
          ...prev,
          images,
        }));
      }}
      className="mb-2 h-12 w-full rounded-xl border border-[var(--border)] px-4"
    />
  ))}
</div>

              <ProductField
                label="Unit label"
                name="unitLabel"
                value={form.unitLabel}
                placeholder="1 kg"
                onChange={updateField}
                required
              />

              <ProductField
                label="Unit value"
                name="unitValue"
                value={form.unitValue}
                placeholder="1-kg"
                onChange={updateField}
              />

              <ProductField
                label="MRP"
                name="mrp"
                value={form.mrp}
                placeholder="100"
                inputMode="decimal"
                onChange={updateField}
                required
              />

              <ProductField
                label="Selling price"
                name="price"
                value={form.price}
                placeholder="90"
                inputMode="decimal"
                onChange={updateField}
                required
              />

              <ProductField
                label="Stock quantity"
                name="stock"
                value={form.stock}
                placeholder="20"
                inputMode="numeric"
                onChange={updateField}
                required
              />

              <ProductField
                label="Delivery minutes"
                name="deliveryMinutes"
                value={form.deliveryMinutes}
                placeholder="15"
                inputMode="numeric"
                onChange={updateField}
                required
              />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <ProductToggle
                label="Active"
                description="Visible to customers"
                checked={form.active}
                onChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    active: checked,
                  }))
                }
              />

              <ProductToggle
                label="Featured"
                description="Show on home page"
                checked={form.featured}
                onChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    featured: checked,
                  }))
                }
              />

              <ProductToggle
                label="Bestseller"
                description="Show bestseller badge"
                checked={form.bestseller}
                onChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    bestseller: checked,
                  }))
                }
              />
            </div>

            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-[var(--text-primary)]">Product variants</h3>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">Color, size, weight, SKU, barcode, stock और image अलग-अलग रखें।</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, variants: [...current.variants, newVariant()] }))}
                  className="rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-black text-white"
                >
                  Add variant
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {form.variants.map((variant, index) => (
                  <div key={variant.id} className="rounded-xl border border-[var(--border)] bg-white p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black text-[var(--text-primary)]">Variant {index + 1}</p>
                      <button type="button" onClick={() => setForm((current) => ({ ...current, variants: current.variants.filter((item) => item.id !== variant.id) }))} className="text-xs font-bold text-[var(--danger)]">Remove</button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {([['color', 'Color', 'Red'], ['size', 'Size', 'Large'], ['weight', 'Weight', '500 g'], ['sku', 'SKU', 'MILK-500-RED'], ['barcode', 'Barcode', '8901234567890'], ['image', 'Variant image URL', '/products/item.png'], ['mrp', 'MRP', '100'], ['price', 'Selling price', '90'], ['stock', 'Variant stock', '20']] as const).map(([field, label, placeholder]) => (
                        <label key={field} className="block"><span className="mb-1 block text-[11px] font-bold text-[var(--text-secondary)]">{label}{field === 'sku' && <span className="ml-1 text-[var(--danger)]">*</span>}</span><input value={variant[field]} onChange={(event) => updateVariant(variant.id, field, event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)]" /></label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <div className="sm:col-span-2 lg:col-span-3">
  <p className="mb-3 text-sm font-bold">
    Gallery Images
  </p>

  {[0, 1, 2, 3, 4].map((index) => (
    <input
      key={index}
      type="text"
      placeholder={`Image ${index + 1}`}
      value={form.images[index] || ""}
      onChange={(e) => {
        const images = [...form.images];
        images[index] = e.target.value;

        setForm((prev) => ({
          ...prev,
          images,
        }));
      }}
      className="mb-2 h-12 w-full rounded-xl border border-[var(--border)] px-4"
    />
  ))}
</div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]"
              >
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-sm font-black text-white disabled:opacity-50"
              >
                <Save size={17} />
                {submitting
                  ? "Saving product..."
                  : "Save product"}
              </button>

              <Link
                href="/admin/products"
                className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-[var(--border)] text-sm font-black text-[var(--text-secondary)]"
              >
                Cancel
              </Link>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}

type ProductFieldProps = {
  label: string;
  name: keyof ProductForm;
  value: string;
  placeholder: string;
  required?: boolean;
  inputMode?: "text" | "numeric" | "decimal";
  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

function ProductField({
  label,
  name,
  value,
  placeholder,
  required = false,
  inputMode = "text",
  onChange,
}: ProductFieldProps) {
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

function ProductToggle({
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

        <span className="mt-1 block text-[9px] text-[var(--text-muted)]">
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

      <span className="relative h-7 w-12 rounded-full bg-[var(--surface-muted)] transition peer-checked:bg-[var(--primary)]">
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
