"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  PackagePlus,
  Save,
  Trash2,
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
  getAdminProductById,
  updateAdminProduct,
  getAdminBrandOptions,
  getAdminCategoryOptions,
  uploadAdminProductImages,
  type ProductOption,
  type AdminProductPayload,
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

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminProductEditClient({ productId }: { productId: string }) {
  const router = useRouter();
  const { hydrated: accountHydrated, session } = useAccount();
  const accessToken = session?.accessToken || "";

  const [categories, setCategories] = useState<ProductOption[]>([]);
  const [brands, setBrands] = useState<ProductOption[]>([]);

  const [form, setForm] = useState<ProductForm>(initialForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [thumbnailItems, setThumbnailItems] = useState<ImageUploaderItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<ImageUploaderItem[]>([]);

  // Fetch product data and options
  useEffect(() => {
    if (!accountHydrated || !productId) return;

    if (!accessToken) {
      setHydrated(true);
      return;
    }

    const loadData = async () => {
      try {
        const [categoryOptions, brandOptions, product] = await Promise.all([
          getAdminCategoryOptions(accessToken),
          getAdminBrandOptions(accessToken),
          getAdminProductById(accessToken, productId),
        ]);

        setCategories(categoryOptions);
        setBrands(brandOptions);

        setForm({
          name: product.name,
          slug: product.slug,
          sku: product.sku || "",
          barcode: product.barcode || "",
          brandId: product.brandId || "",
          categoryId: product.categoryId || "",
          image: product.thumbnail || product.image || "",
          images: product.images || [],
          fallbackIcon: product.fallbackIcon || "📦",
          unitLabel: product.unit?.label || "",
          unitValue: product.unit?.value || "",
          mrp: String(product.mrp || 0),
          price: String(product.price || 0),
          stock: String(product.stock || 0),
          deliveryMinutes: String(product.deliveryMinutes || 15),
          featured: product.featured || false,
          bestseller: product.bestseller || false,
          active: product.active || false,
          description: product.description || "",
          tags: product.tags?.join(", ") || "",
          videoUrl: product.videoUrl || "",
          ingredients: product.ingredients || "",
          storageInstructions: product.storageInstructions || "",
          usageInstructions: product.usageInstructions || "",
          replacementPolicy: product.replacementPolicy || "",
          highlights: product.highlights || [],
          attributes: product.attributes || [],
          variants: (product.variants || []).map((v) => ({
            id: v.id,
            color: v.color || "",
            size: v.size || "",
            weight: v.weight || "",
            sku: v.sku || "",
            barcode: v.barcode || "",
            image: v.image || "",
            mrp: String(v.mrp || 0),
            price: String(v.price || 0),
            stock: String(v.stock || 0),
          })),
        });

        if (product.thumbnail) {
          setThumbnailItems([{ id: "thumb", url: product.thumbnail, name: "thumbnail", progress: 100, status: "uploaded" }]);
        }
        if (product.images && product.images.length > 0) {
          setGalleryItems(product.images.map((url, idx) => ({ id: `gal-${idx}`, url, name: `gallery-${idx}`, progress: 100, status: "uploaded" })));
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product details.");
      } finally {
        setHydrated(true);
      }
    };

    void loadData();
  }, [accessToken, accountHydrated, productId]);

  // Unsaved changes browser prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const updateField = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setIsDirty(true);
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
    if (form.name.trim().length < 2) return "Please enter a valid product name.";
    if (!form.categoryId) return "Please select a category.";
    if (!form.unitLabel.trim()) return "Please enter the product unit.";

    const mrp = Number(form.mrp);
    const price = Number(form.price);
    const stock = Number(form.stock);
    const deliveryMinutes = Number(form.deliveryMinutes);

    if (!Number.isFinite(mrp) || mrp <= 0) return "MRP must be greater than zero.";
    if (!Number.isFinite(price) || price < 0) return "Selling price cannot be negative.";
    if (price > mrp) return "Selling price cannot be greater than MRP.";
    if (!Number.isInteger(stock) || stock < 0) return "Stock must be a valid whole number.";
    if (!Number.isInteger(deliveryMinutes) || deliveryMinutes < 1) return "Delivery time must be at least 1 minute.";

    return "";
  };

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (!accessToken) throw new Error("Your session has expired. Please sign in again.");

      const thumbnailFile = thumbnailItems.find((item) => item.file)?.file;
      const galleryFiles = galleryItems.flatMap((item) => (item.file ? [item.file] : []));

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

      const payload: Partial<AdminProductPayload> = {
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
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
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
      };

      const updated = await updateAdminProduct(accessToken, productId, payload);
      setSuccess(`${updated.name} updated successfully.`);
      setIsDirty(false);

      window.setTimeout(() => {
        router.push("/admin/products");
      }, 900);
    } catch (caughtError: any) {
      setError(caughtError.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const addHighlight = () => {
    setIsDirty(true);
    setForm((current) => ({
      ...current,
      highlights: [...current.highlights, ""],
    }));
  };

  const updateHighlight = (index: number, value: string) => {
    setIsDirty(true);
    setForm((current) => {
      const next = [...current.highlights];
      next[index] = value;
      return { ...current, highlights: next };
    });
  };

  const removeHighlight = (index: number) => {
    setIsDirty(true);
    setForm((current) => ({
      ...current,
      highlights: current.highlights.filter((_, i) => i !== index),
    }));
  };

  const addAttribute = () => {
    setIsDirty(true);
    setForm((current) => ({
      ...current,
      attributes: [...current.attributes, { label: "", value: "" }],
    }));
  };

  const updateAttribute = (index: number, field: "label" | "value", value: string) => {
    setIsDirty(true);
    setForm((current) => {
      const next = [...current.attributes];
      next[index] = { ...next[index], [field]: value };
      return { ...current, attributes: next };
    });
  };

  const removeAttribute = (index: number) => {
    setIsDirty(true);
    setForm((current) => ({
      ...current,
      attributes: current.attributes.filter((_, i) => i !== index),
    }));
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--primary)]">
                Local admin
              </p>

              <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                Edit product
              </h1>

              <p className="text-xs text-[var(--text-muted)]">
                Update product properties in local inventory
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
                          ⚠️ Non-leaf Category
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
                      setIsDirty(true);
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
                Upload thumbnail, multiple gallery images and optional video URL.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <ImageUploader
                    label="Thumbnail Image"
                    value={thumbnailItems}
                    onChange={(items) => {
                      setIsDirty(true);
                      setThumbnailItems(items);
                    }}
                    maxFiles={1}
                  />
                </div>
                <div>
                  <ImageUploader
                    label="Gallery Images"
                    value={galleryItems}
                    onChange={(items) => {
                      setIsDirty(true);
                      setGalleryItems(items);
                    }}
                    multiple
                    maxFiles={50}
                  />
                </div>
              </div>

              <div className="mt-6">
                <ProductField
                  label="Optional Video URL (YouTube, Vimeo, MP4)"
                  name="videoUrl"
                  value={form.videoUrl}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={updateField}
                />
              </div>
            </div>

            {/* 4. Specifications & Highlights */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[var(--text-primary)]">
                    Highlights
                  </h2>
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="h-8 px-3 text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] rounded-lg hover:brightness-95"
                  >
                    Add
                  </button>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Key callouts to display on the product details page.
                </p>

                <div className="mt-4 space-y-2">
                  {form.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={highlight}
                        onChange={(e) => updateHighlight(index, e.target.value)}
                        placeholder="E.g., 100% Organic"
                        className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-semibold outline-none focus:border-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => removeHighlight(index)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {form.highlights.length === 0 && (
                    <p className="text-center text-xs text-[var(--text-muted)] py-4">
                      No highlights added.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[var(--text-primary)]">
                    Technical Specifications
                  </h2>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="h-8 px-3 text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] rounded-lg hover:brightness-95"
                  >
                    Add
                  </button>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  E.g., Shelf Life: 7 Days, Storage: Refrigerated.
                </p>

                <div className="mt-4 space-y-2">
                  {form.attributes.map((attr, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={attr.label}
                        onChange={(e) => updateAttribute(index, "label", e.target.value)}
                        placeholder="Label"
                        className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-semibold outline-none focus:border-[var(--primary)]"
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, "value", e.target.value)}
                        placeholder="Value"
                        className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-semibold outline-none focus:border-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttribute(index)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {form.attributes.length === 0 && (
                    <p className="text-center text-xs text-[var(--text-muted)] py-4">
                      No specifications added.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Extra Details */}
            <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                Additional Information
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Ingredients, storage rules, instructions and returns.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Ingredients list
                  </span>
                  <textarea
                    name="ingredients"
                    value={form.ingredients}
                    placeholder="List all ingredients..."
                    onChange={updateField}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Storage instructions
                  </span>
                  <textarea
                    name="storageInstructions"
                    value={form.storageInstructions}
                    placeholder="E.g., Keep refrigerated at 4°C..."
                    onChange={updateField}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Usage instructions
                  </span>
                  <textarea
                    name="usageInstructions"
                    value={form.usageInstructions}
                    placeholder="E.g., Shake well before use..."
                    onChange={updateField}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Replacement/Refund Policy
                  </span>
                  <textarea
                    name="replacementPolicy"
                    value={form.replacementPolicy}
                    placeholder="E.g., Non-returnable unless damaged..."
                    onChange={updateField}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
                  />
                </label>
              </div>
            </div>

            {/* Status Checkboxes */}
            <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                Status and Visibility
              </h2>
              <div className="mt-4 flex flex-wrap gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => {
                      setIsDirty(true);
                      setForm((current) => ({ ...current, active: e.target.checked }));
                    }}
                    className="h-5 w-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    Active (Visible in catalog)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => {
                      setIsDirty(true);
                      setForm((current) => ({ ...current, featured: e.target.checked }));
                    }}
                    className="h-5 w-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    Featured Product
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.bestseller}
                    onChange={(e) => {
                      setIsDirty(true);
                      setForm((current) => ({ ...current, bestseller: e.target.checked }));
                    }}
                    className="h-5 w-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    Bestseller
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Link
                href="/admin/products"
                className="flex h-12 items-center justify-center rounded-xl border border-[var(--border)] px-6 text-sm font-bold text-[var(--text-secondary)] hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50"
              >
                <Save size={16} />
                {submitting ? "Saving..." : "Save Product"}
              </button>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}

function ProductField({
  label,
  name,
  value,
  placeholder,
  onChange,
  required = false,
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
        {label} {required && <span className="text-[var(--danger)]">*</span>}
      </span>
      <input
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
        inputMode={inputMode}
        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
      />
    </label>
  );
}
