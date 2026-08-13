"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  PackagePlus,
  Save,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import {
  ImageUploader,
  type ImageUploaderItem,
} from "@/components/admin/media";
import { useAccount } from "@/hooks/useAccount";
import {
  createAdminProduct,
  getAdminBrandOptions,
  getAdminCategoryOptions,
  uploadAdminProductImages,
  type ProductOption,
} from "@/services/adminProducts.service";

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
  brandId: string;
  categoryId: string;
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
  sku: string;
  barcode: string;
  description: string;
  videoUrl: string;
  ingredients: string;
  storageInstructions: string;
  usageInstructions: string;
  replacementPolicy: string;
  highlights: string[];
  attributes: { label: string; value: string }[];
};

const initialForm: ProductForm = {
  images: [],
  tags: "",
  variants: [],
  name: "",
  slug: "",
  brandId: "",
  categoryId: "",
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
  sku: "",
  barcode: "",
  description: "",
  videoUrl: "",
  ingredients: "",
  storageInstructions: "",
  usageInstructions: "",
  replacementPolicy: "",
  highlights: [],
  attributes: [],
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

  const { hydrated: accountHydrated, session } = useAccount();
  const accessToken = session?.accessToken;
  const [categories, setCategories] = useState<ProductOption[]>([]);
  const [brands, setBrands] = useState<ProductOption[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [form, setForm] = useState<ProductForm>(initialForm);

  const [slugEdited, setSlugEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [thumbnailItems, setThumbnailItems] = useState<ImageUploaderItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<ImageUploaderItem[]>([]);

  useEffect(() => {
    if (!accountHydrated) return;

    if (!accessToken) {
      setHydrated(true);
      return;
    }

    void Promise.all([
      getAdminCategoryOptions(accessToken),
      getAdminBrandOptions(accessToken),
    ])
      .then(([categoryOptions, brandOptions]) => {
        setCategories(categoryOptions);
        setBrands(brandOptions);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Product options could not be loaded.",
        );
      })
      .finally(() => setHydrated(true));
  }, [accessToken, accountHydrated]);

  const updateField = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === "mrp" || name === "price") {
      nextValue = value.replace(/[^\d.]/g, "");
    }

    if (name === "stock" || name === "deliveryMinutes") {
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

      if (name === "unitLabel" && !current.unitValue) {
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

    if (!form.categoryId) {
      return "Please select a category.";
    }

    if (!form.unitLabel.trim()) {
      return "Please enter the product unit.";
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
      return "Selling price cannot be greater than MRP.";
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return "Stock must be a valid whole number.";
    }

    if (!Number.isInteger(deliveryMinutes) || deliveryMinutes < 1) {
      return "Delivery time must be at least 1 minute.";
    }

    return "";
  };

  const updateVariant = (
    id: string,
    field: keyof VariantForm,
    value: string,
  ) => {
    const numericField = ["mrp", "price", "stock"].includes(field);
    const nextValue = numericField
      ? value.replace(field === "stock" ? /\D/g : /[^\d.]/g, "")
      : value;

    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === id ? { ...variant, [field]: nextValue } : variant,
      ),
    }));
    setError("");
  };

  const addHighlight = () => {
    setForm((current) => ({
      ...current,
      highlights: [...current.highlights, ""],
    }));
  };

  const updateHighlight = (index: number, value: string) => {
    setForm((current) => {
      const next = [...current.highlights];
      next[index] = value;
      return { ...current, highlights: next };
    });
  };

  const removeHighlight = (index: number) => {
    setForm((current) => ({
      ...current,
      highlights: current.highlights.filter((_, i) => i !== index),
    }));
  };

  const addAttribute = () => {
    setForm((current) => ({
      ...current,
      attributes: [...current.attributes, { label: "", value: "" }],
    }));
  };

  const updateAttribute = (
    index: number,
    field: "label" | "value",
    value: string,
  ) => {
    setForm((current) => {
      const next = [...current.attributes];
      next[index] = { ...next[index], [field]: value };
      return { ...current, attributes: next };
    });
  };

  const removeAttribute = (index: number) => {
    setForm((current) => ({
      ...current,
      attributes: current.attributes.filter((_, i) => i !== index),
    }));
  };

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
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
      if (!accessToken) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const thumbnailFile = thumbnailItems.find((item) => item.file)?.file;
      const galleryFiles = galleryItems.flatMap((item) =>
        item.file ? [item.file] : [],
      );
      const uploadedImages =
        thumbnailFile || galleryFiles.length
          ? await uploadAdminProductImages(accessToken, {
              thumbnail: thumbnailFile,
              gallery: galleryFiles,
            })
          : {};
      let galleryIndex = 0;
      const gallery = galleryItems
        .map((item) => {
          if (!item.file) return item.url;

          const url = uploadedImages.gallery?.[galleryIndex];
          galleryIndex += 1;
          return url || "";
        })
        .filter(Boolean);
      const product = await createAdminProduct(accessToken, {
        name: form.name.trim(),
        slug: form.slug.trim() || createSlug(form.name),
        brand: form.brandId || undefined,
        category: form.categoryId,
        description: form.description.trim() || undefined,
        thumbnail: thumbnailFile
          ? uploadedImages.thumbnail || ""
          : thumbnailItems[0]?.url || form.image.trim(),
        gallery: gallery.length ? gallery : form.images.filter(Boolean),
        sku: form.sku.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        showOnHome: false,
        displayOrder: 0,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        variants: form.variants.map((variant, index) => ({
          id: variant.id,
          name:
            [variant.color, variant.size, variant.weight]
              .filter(Boolean)
              .join(" · ") || `Variant ${index + 1}`,
          sku: variant.sku.trim(),
          barcode: variant.barcode.trim() || undefined,
          color: variant.color.trim() || undefined,
          size: variant.size.trim() || undefined,
          weight: variant.weight.trim() || undefined,
          image: variant.image.trim() || undefined,
          images: variant.image.trim() ? [variant.image.trim()] : [],
          attributes: Object.fromEntries(
            [
              ["Color", variant.color],
              ["Size", variant.size],
              ["Weight", variant.weight],
            ].filter(([, value]) => value.trim()),
          ),
          unit: {
            label: variant.weight.trim() || form.unitLabel.trim(),
            value: createSlug(
              variant.weight || form.unitValue || form.unitLabel,
            ),
          },
          mrp: Number(variant.mrp || form.mrp),
          price: Number(variant.price || form.price),
          stock: Number(variant.stock || 0),
          active: true,
        })),
        fallbackIcon: form.fallbackIcon.trim() || undefined,
        unit: form.unitValue.trim() || form.unitLabel.trim(),
        weight: Number.parseFloat(form.unitLabel) || undefined,
        mrp: Number(form.mrp),
        sellingPrice: Number(form.price),
        stock: Number(form.stock),
        deliveryMinutes: Number(form.deliveryMinutes),
        featured: form.featured,
        bestseller: form.bestseller,
        active: form.active,
        videoUrl: form.videoUrl.trim() || undefined,
        ingredients: form.ingredients.trim() || undefined,
        storageInstructions: form.storageInstructions.trim() || undefined,
        usageInstructions: form.usageInstructions.trim() || undefined,
        replacementPolicy: form.replacementPolicy.trim() || undefined,
        highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
        attributes: form.attributes
          .map((attr) => ({
            label: attr.label.trim(),
            value: attr.value.trim(),
          }))
          .filter((attr) => attr.label && attr.value),
      });

      setSuccess(`${product.name} added successfully.`);

      window.setTimeout(() => {
        router.push("/admin/products");
      }, 900);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Product could not be added.",
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

          <form onSubmit={submitProduct} className="space-y-6">
            {/* 1. Basic Information Card */}
            <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--primary-light)] text-[var(--primary)]">
                  <PackagePlus size={22} />
                </span>
                <div>
                  <h2 className="text-lg font-black text-[var(--text-primary)]">
                    Basic Information
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    General details about the product.
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
                  label="Product slug"
                  name="slug"
                  value={form.slug}
                  placeholder="fresh-milk"
                  onChange={updateField}
                  required
                />

                <ProductField
                  label="SKU"
                  name="sku"
                  value={form.sku}
                  placeholder="MILK-1L"
                  onChange={updateField}
                />

                <ProductField
                  label="Barcode"
                  name="barcode"
                  value={form.barcode}
                  placeholder="8901234567890"
                  onChange={updateField}
                />

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Brand <span className="text-[var(--danger)]">*</span>
                  </span>
                  <select
                    name="brandId"
                    value={form.brandId}
                    onChange={updateField}
                    required
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                  >
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="block text-xs font-bold text-[var(--text-secondary)]">
                      Category (Leaf / Level 3 Recommended) <span className="text-[var(--danger)]">*</span>
                    </span>
                    {form.categoryId && (() => {
                      const selectedCat = categories.find((c) => c.id === form.categoryId);
                      const isLeaf = (selectedCat as any)?.level === 3;
                      return isLeaf ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Level 3 Leaf Category
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          ⚠️ Non-leaf Category (Level {(selectedCat as any)?.level || 1})
                        </span>
                      );
                    })()}
                  </div>
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={updateField}
                    required
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => {
                      const level = (category as any).level || 1;
                      const label = (category as any).hierarchyPath || category.name;
                      return (
                        <option key={category.id} value={category.id}>
                          {`[L${level}] ${label}`}
                        </option>
                      );
                    })}
                  </select>
                </label>


                <ProductField
                  label="Fallback Icon"
                  name="fallbackIcon"
                  value={form.fallbackIcon}
                  placeholder="📦"
                  onChange={updateField}
                />

                <ProductField
                  label="Tags (comma separated)"
                  name="tags"
                  value={form.tags}
                  placeholder="organic, popular, dairy"
                  onChange={updateField}
                />
              </div>

              <div className="mt-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Description
                  </span>
                  <textarea
                    name="description"
                    value={form.description}
                    placeholder="Describe this product..."
                    onChange={(event) => {
                      const { name, value } = event.target;
                      setForm((current) => ({ ...current, [name]: value }));
                    }}
                    rows={4}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:font-normal placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>
              </div>
            </div>

            {/* 2. Pricing & Inventory Card */}
            <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--primary-light)] text-[var(--primary)]">
                  <Boxes size={22} />
                </span>
                <div>
                  <h2 className="text-lg font-black text-[var(--text-primary)]">
                    Pricing & Inventory
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Set price point, stock level, unit and delivery timings.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  label="Delivery minutes"
                  name="deliveryMinutes"
                  value={form.deliveryMinutes}
                  placeholder="15"
                  inputMode="numeric"
                  onChange={updateField}
                  required
                />
              </div>
            </div>

            {/* 3. Media Card */}
            <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                Product Media
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Upload thumbnail, multiple gallery images (unlimited support)
                and optional video URL.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <ImageUploader
                    label="Thumbnail Image"
                    value={thumbnailItems}
                    onChange={setThumbnailItems}
                    maxFiles={1}
                  />
                </div>
                <div>
                  <ImageUploader
                    label="Gallery Images (unlimited)"
                    value={galleryItems}
                    onChange={setGalleryItems}
                    multiple
                    maxFiles={50}
                  />
                </div>
              </div>

              <div className="mt-4">
                <ProductField
                  label="Product Video URL (optional)"
                  name="videoUrl"
                  value={form.videoUrl}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={updateField}
                />
              </div>
            </div>

            {/* 4. Product Status Card */}
            <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                Product Status & Badges
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Control visibility and homepage promotions.
              </p>

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
            </div>

            {/* 5. Category-Specific Product Details Card */}
            <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-[var(--text-primary)]">
                    Category-Specific Attributes
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Add custom attributes depending on the selected category
                    (e.g. Fat Profile, Shelf Life, Biological Source).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addAttribute}
                  className="rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-black text-white"
                >
                  Add Row
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {form.attributes.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] italic">
                    No attributes added yet. Click Add Row to add details.
                  </p>
                )}
                {form.attributes.map((attr, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Label (e.g. Fat Profile)"
                      value={attr.label}
                      onChange={(e) =>
                        updateAttribute(index, "label", e.target.value)
                      }
                      className="h-10 flex-1 rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Toned)"
                      value={attr.value}
                      onChange={(e) =>
                        updateAttribute(index, "value", e.target.value)
                      }
                      className="h-10 flex-1 rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="text-xs font-bold text-[var(--danger)] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Highlights Card */}
            <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-[var(--text-primary)]">
                    Key Highlights
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Add key bullet points to summarize this product (e.g. Rich
                    in Calcium, Pasteurized).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addHighlight}
                  className="rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-black text-white"
                >
                  Add Highlight
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {form.highlights.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] italic">
                    No highlights added yet. Click Add Highlight to add bullets.
                  </p>
                )}
                {form.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Highlight point..."
                      value={highlight}
                      onChange={(e) => updateHighlight(index, e.target.value)}
                      className="h-10 flex-1 rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      className="text-xs font-bold text-[var(--danger)] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Additional Information Card */}
            <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                Additional Information
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Provide details about ingredients, storage, usage, and policies.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Ingredients
                  </span>
                  <textarea
                    name="ingredients"
                    value={form.ingredients}
                    placeholder="List product ingredients..."
                    onChange={(event) => {
                      const { name, value } = event.target;
                      setForm((current) => ({ ...current, [name]: value }));
                    }}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:font-normal placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Storage Instructions
                  </span>
                  <textarea
                    name="storageInstructions"
                    value={form.storageInstructions}
                    placeholder="Store in cool, dry place..."
                    onChange={(event) => {
                      const { name, value } = event.target;
                      setForm((current) => ({ ...current, [name]: value }));
                    }}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:font-normal placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Usage Instructions
                  </span>
                  <textarea
                    name="usageInstructions"
                    value={form.usageInstructions}
                    placeholder="How to use this product..."
                    onChange={(event) => {
                      const { name, value } = event.target;
                      setForm((current) => ({ ...current, [name]: value }));
                    }}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:font-normal placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Replacement / Return Policy
                  </span>
                  <textarea
                    name="replacementPolicy"
                    value={form.replacementPolicy}
                    placeholder="Describe replacement / return terms..."
                    onChange={(event) => {
                      const { name, value } = event.target;
                      setForm((current) => ({ ...current, [name]: value }));
                    }}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:font-normal placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>
              </div>
            </div>

            {/* 8. Variants (Unchanged) */}
            <section className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-[var(--text-primary)]">
                    Product variants
                  </h3>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Color, size, weight, SKU, barcode, stock और image अलग-अलग
                    रखें।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      variants: [...current.variants, newVariant()],
                    }))
                  }
                  className="rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-black text-white"
                >
                  Add variant
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {form.variants.map((variant, index) => (
                  <div
                    key={variant.id}
                    className="rounded-xl border border-[var(--border)] bg-white p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black text-[var(--text-primary)]">
                        Variant {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            variants: current.variants.filter(
                              (item) => item.id !== variant.id,
                            ),
                          }))
                        }
                        className="text-xs font-bold text-[var(--danger)]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(
                        [
                          ["color", "Color", "Red"],
                          ["size", "Size", "Large"],
                          ["weight", "Weight", "500 g"],
                          ["sku", "SKU", "MILK-500-RED"],
                          ["barcode", "Barcode", "8901234567890"],
                          ["image", "Variant image URL", "/products/item.png"],
                          ["mrp", "MRP", "100"],
                          ["price", "Selling price", "90"],
                          ["stock", "Variant stock", "20"],
                        ] as const
                      ).map(([field, label, placeholder]) => (
                        <label key={field} className="block">
                          <span className="mb-1 block text-[11px] font-bold text-[var(--text-secondary)]">
                            {label}
                            {field === "sku" && (
                              <span className="ml-1 text-[var(--danger)]">
                                *
                              </span>
                            )}
                          </span>
                          <input
                            value={variant[field]}
                            onChange={(event) =>
                              updateVariant(
                                variant.id,
                                field,
                                event.target.value,
                              )
                            }
                            placeholder={placeholder}
                            className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]"
              >
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-sm font-black text-white disabled:opacity-50"
              >
                <Save size={17} />
                {submitting ? "Saving product..." : "Save product"}
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
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
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

        {required && <span className="ml-1 text-[var(--danger)]">*</span>}
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
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span className="relative h-7 w-12 rounded-full bg-[var(--surface-muted)] transition peer-checked:bg-[var(--primary)]">
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
