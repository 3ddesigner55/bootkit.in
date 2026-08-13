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
  Upload,
  Download,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import {
  ImageUploader,
  type ImageUploaderItem,
} from "@/components/admin/media";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";
import {
  deleteAdminProduct,
  getAdminBrandOptions,
  getAdminCategoryOptions,
  getAdminProducts,
  updateAdminProduct,
  uploadAdminProductImages,
  validateAdminProductCsv,
  confirmAdminProductImport,
  type AdminProduct,
  type ProductOption,
  type CsvImportResult,
} from "@/services/adminProducts.service";

type ProductFilter =
  "All" | "Active" | "Inactive" | "Low Stock" | "Featured" | "Bestseller";

type ProductEditForm = {
  name: string;
  brandId: string;
  categoryId: string;
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
  description: string;
  thumbnail: string;
  gallery: string[];
  sku: string;
  barcode: string;
  showOnHome: boolean;
  displayOrder: string;
};

function productToForm(product: AdminProduct): ProductEditForm {
  return {
    name: product.name,
    brandId: product.brandId ?? "",
    categoryId: product.categoryId ?? "",
    fallbackIcon: product.fallbackIcon,
    unitLabel: product.unit.label,
    unitValue: product.unit.value,
    mrp: String(product.mrp),
    price: String(product.price),
    stock: String(product.stock),
    deliveryMinutes:
      product.deliveryMinutes === undefined
        ? ""
        : String(product.deliveryMinutes),
    active: product.active,
    featured: product.featured,
    bestseller: product.bestseller,
    description: product.description,
    thumbnail: product.thumbnail ?? "",
    gallery: product.gallery,
    sku: product.sku,
    barcode: product.barcode,
    showOnHome: product.showOnHome,
    displayOrder: String(product.displayOrder),
  };
}

export default function AdminProductsClient() {
  const { hydrated: accountHydrated, session } = useAccount();
  const accessToken = session?.accessToken;
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<ProductOption[]>([]);
  const [brands, setBrands] = useState<ProductOption[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [sort, setSort] = useState<
    | "display-order"
    | "newest"
    | "price-asc"
    | "price-desc"
    | "name-asc"
    | "name-desc"
    | "stock-asc"
    | "stock-desc"
  >("display-order");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("All");

  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );

  const [form, setForm] = useState<ProductEditForm | null>(null);

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [thumbnailItems, setThumbnailItems] = useState<ImageUploaderItem[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(
    null,
  );
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "update">(
    "skip",
  );
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [galleryItems, setGalleryItems] = useState<ImageUploaderItem[]>([]);

  const loadProducts = useCallback(async () => {
    if (!accessToken) {
      setProducts([]);
      setHydrated(true);
      return;
    }

    try {
      const [productResult, categoryOptions, brandOptions] = await Promise.all([
        getAdminProducts(accessToken, {
          page,
          search: query,
          category: categoryId || undefined,
          brand: brandId || undefined,
          active:
            filter === "Active"
              ? true
              : filter === "Inactive"
                ? false
                : undefined,
          featured: filter === "Featured" ? true : undefined,
          bestseller: filter === "Bestseller" ? true : undefined,
          stockStatus: filter === "Low Stock" ? "low-stock" : undefined,
          sort,
        }),
        getAdminCategoryOptions(accessToken),
        getAdminBrandOptions(accessToken),
      ]);

      setProducts(productResult.products);
      setPagination(productResult.pagination);
      setCategories(categoryOptions);
      setBrands(brandOptions);
      setError("");
    } catch (loadError) {
      setProducts([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Products could not be loaded.",
      );
    } finally {
      setHydrated(true);
    }
  }, [accessToken, brandId, categoryId, filter, page, query, sort]);

  useEffect(() => {
    if (!accountHydrated) return;
    void loadProducts();
  }, [accountHydrated, loadProducts]);

  const filteredProducts = products;

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((product) => product.active).length,
      lowStock: products.filter((product) => product.stock <= 10).length,
      inventoryValue: products.reduce(
        (total, product) => total + product.price * product.stock,
        0,
      ),
    };
  }, [products]);

  const openEditForm = (product: AdminProduct) => {
    setEditingProduct(product);
    setForm(productToForm(product));
    setThumbnailItems(
      product.thumbnail
        ? [
            {
              id: `thumbnail-${product.id}`,
              url: product.thumbnail,
              name: "Thumbnail",
              progress: 100,
              status: "uploaded",
            },
          ]
        : [],
    );
    setGalleryItems(
      product.gallery.map((url, index) => ({
        id: `gallery-${product.id}-${index}`,
        url,
        name: `Gallery image ${index + 1}`,
        progress: 100,
        status: "uploaded",
      })),
    );
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
    setThumbnailItems([]);
    setGalleryItems([]);
  };

  const updateTextField = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!form) return;

    const { name, value } = event.target;

    let nextValue = value;

    if (
      name === "mrp" ||
      name === "price" ||
      name === "stock" ||
      name === "deliveryMinutes" ||
      name === "displayOrder"
    ) {
      nextValue = value.replace(/[^\d.]/g, "");
    }

    setForm((current) =>
      current
        ? {
            ...current,
            [name]: nextValue,
          }
        : current,
    );

    setFormError("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    if (!form) return "Product form is unavailable.";

    if (form.name.trim().length < 2) {
      return "Please enter a valid product name.";
    }

    if (!form.categoryId) {
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

    if (!Number.isInteger(stock) || stock < 0) {
      return "Stock must be a valid whole number.";
    }

    if (!Number.isInteger(deliveryMinutes) || deliveryMinutes < 1) {
      return "Delivery time must be at least 1 minute.";
    }

    return "";
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingProduct || !form) return;

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!accessToken) {
      setFormError("Your session has expired. Please sign in again.");
      return;
    }

    try {
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
      const thumbnail = thumbnailFile
        ? uploadedImages.thumbnail || ""
        : thumbnailItems[0]?.url || "";
      const updatedProduct = await updateAdminProduct(
        accessToken,
        editingProduct.id,
        {
          name: form.name.trim(),
          category: form.categoryId,
          brand: form.brandId || undefined,
          fallbackIcon: form.fallbackIcon.trim() || undefined,
          unit: form.unitValue.trim() || form.unitLabel.trim(),
          weight: Number.parseFloat(form.unitLabel) || undefined,
          mrp: Number(form.mrp),
          sellingPrice: Number(form.price),
          stock: Number(form.stock),
          deliveryMinutes: Number(form.deliveryMinutes),
          active: form.active,
          featured: form.featured,
          bestseller: form.bestseller,
          description: form.description,
          thumbnail,
          gallery,
          sku: form.sku,
          barcode: form.barcode,
          showOnHome: form.showOnHome,
          displayOrder: Number(form.displayOrder),
        },
      );

      setProducts((current) =>
        current.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product,
        ),
      );
      setSuccessMessage(`${form.name.trim()} updated successfully.`);
      closeEditForm();
      window.setTimeout(() => setSuccessMessage(""), 3000);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : "Product could not be updated.",
      );
    }
  };

  const confirmDeleteProduct = async (product: AdminProduct) => {
    const confirmed = window.confirm(`Delete "${product.name}"?`);

    if (!confirmed) return;

    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    try {
      await deleteAdminProduct(accessToken, product.id);
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );

      if (editingProduct?.id === product.id) {
        closeEditForm();
      }

      setSuccessMessage(`${product.name} deleted successfully.`);

      window.setTimeout(() => setSuccessMessage(""), 3000);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Product could not be deleted.",
      );
    }
  };

  const confirmResetProducts = () => {
    const confirmed = window.confirm("Reload products from the server?");

    if (!confirmed) return;

    closeEditForm();
    void loadProducts();
    setSuccessMessage("Products reloaded.");
    window.setTimeout(() => setSuccessMessage(""), 3000);
  };

  const updateToggle = async (
    product: AdminProduct,
    updates:
      | Pick<AdminProduct, "active">
      | Pick<AdminProduct, "featured">
      | Pick<AdminProduct, "bestseller">,
  ) => {
    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    try {
      const updatedProduct = await updateAdminProduct(
        accessToken,
        product.id,
        updates,
      );
      setProducts((current) =>
        current.map((item) =>
          item.id === updatedProduct.id ? updatedProduct : item,
        ),
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Product could not be updated.",
      );
    }
  };

  const escapeCsvValue = (
    val: string | number | boolean | null | undefined,
  ): string => {
    if (val === undefined || val === null) return "";
    const str = String(val);
    if (
      str.includes(",") ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleCsvFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!accessToken) {
      setImportError("Your session has expired. Please sign in again.");
      return;
    }

    setImportFile(file);
    setImportResult(null);
    setImportError("");
    setImportSuccess("");

    try {
      const res = await validateAdminProductCsv(accessToken, file);
      setImportResult(res);
    } catch (err: unknown) {
      setImportError(
        err instanceof Error ? err.message : "Failed to validate CSV file.",
      );
    }
  };

  const handleConfirmImport = async () => {
    if (!accessToken || !importResult) return;

    const validRows = importResult.rows.filter(
      (r) =>
        r.status === "valid" ||
        (r.status === "duplicate" && duplicateAction === "update"),
    );

    const productsToImport = validRows
      .map((r) => r.data)
      .filter((d): d is Record<string, unknown> => Boolean(d));

    if (productsToImport.length === 0) {
      setImportError("No valid rows available to import.");
      return;
    }

    setIsImporting(true);
    setImportError("");
    setImportSuccess("");

    try {
      const res = await confirmAdminProductImport(
        accessToken,
        productsToImport,
        duplicateAction,
      );
      setImportSuccess(`Successfully imported ${res.importedCount} products.`);
      void loadProducts();
      window.setTimeout(() => {
        setIsImportModalOpen(false);
        setImportFile(null);
        setImportResult(null);
        setImportSuccess("");
      }, 2000);
    } catch (err: unknown) {
      setImportError(
        err instanceof Error
          ? err.message
          : "Failed to confirm product import.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const downloadCsvTemplate = () => {
    const headers = [
      "name",
      "slug",
      "sku",
      "barcode",
      "category",
      "brand",
      "description",
      "mrp",
      "sellingPrice",
      "stock",
      "unit",
      "deliveryMinutes",
      "thumbnail",
      "gallery",
      "videoUrl",
      "active",
      "featured",
      "bestseller",
      "attributes",
      "highlights",
      "ingredients",
      "storageInstructions",
      "usageInstructions",
      "replacementPolicy",
    ];

    const sampleRow = [
      "Amul Taaza Milk",
      "amul-taaza-milk",
      "AMUL-TZ-1L",
      "8901262010123",
      "milk-dairy",
      "amul",
      "Pasteurized toned milk rich in nutrition",
      "70.00",
      "66.00",
      "120",
      "1 Litre",
      "15",
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      "https://res.cloudinary.com/demo/image/upload/gal1.jpg|https://res.cloudinary.com/demo/image/upload/gal2.jpg",
      "https://youtube.com/watch?v=sample",
      "true",
      "true",
      "false",
      "Fat Profile::Toned|Shelf Life::2 Days",
      "Rich in Calcium|Fresh Cow Milk|Pasteurized",
      "Toned Milk",
      "Keep refrigerated below 4°C",
      "Ready to consume or boil",
      "Non-returnable / 24-hr replacement",
    ];

    const csvContent = [
      headers.join(","),
      sampleRow.map(escapeCsvValue).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "bootkit_product_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadErrorCsv = () => {
    if (!importResult) return;

    const invalidRows = importResult.rows.filter((r) => r.status === "invalid");
    if (invalidRows.length === 0) return;

    const headers = [
      "name",
      "slug",
      "sku",
      "barcode",
      "category",
      "brand",
      "description",
      "mrp",
      "sellingPrice",
      "stock",
      "unit",
      "deliveryMinutes",
      "thumbnail",
      "gallery",
      "videoUrl",
      "active",
      "featured",
      "bestseller",
      "attributes",
      "highlights",
      "ingredients",
      "storageInstructions",
      "usageInstructions",
      "replacementPolicy",
      "errorDetails",
    ];

    const csvRows = [headers.join(",")];

    invalidRows.forEach((row) => {
      const errorMsg = row.errors.join("; ");
      const rowData = [
        row.raw.name || "",
        row.raw.slug || "",
        row.raw.sku || "",
        row.raw.barcode || "",
        row.raw.category || "",
        row.raw.brand || "",
        row.raw.description || "",
        row.raw.mrp || "",
        row.raw.sellingprice || row.raw.sellingPrice || "",
        row.raw.stock || "",
        row.raw.unit || "",
        row.raw.deliveryminutes || row.raw.deliveryMinutes || "",
        row.raw.thumbnail || "",
        row.raw.gallery || "",
        row.raw.videourl || row.raw.videoUrl || "",
        row.raw.active || "",
        row.raw.featured || "",
        row.raw.bestseller || "",
        row.raw.attributes || "",
        row.raw.highlights || "",
        row.raw.ingredients || "",
        row.raw.storageinstructions || row.raw.storageInstructions || "",
        row.raw.usageinstructions || row.raw.usageInstructions || "",
        row.raw.replacementpolicy || row.raw.replacementPolicy || "",
        errorMsg,
      ];
      csvRows.push(rowData.map(escapeCsvValue).join(","));
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "import_errors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              href="/admin/catalog/import"
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-[11px] font-black text-[var(--text-primary)] hover:bg-slate-50"
            >
              <Upload size={15} />
              Import CSV
            </Link>

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

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]">
              {error}
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

              <form onSubmit={saveProduct} className="mt-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AdminField
                    label="Product name"
                    name="name"
                    value={form.name}
                    onChange={updateTextField}
                    placeholder="Product name"
                    required
                  />

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                      Brand
                    </span>

                    <select
                      name="brandId"
                      value={form.brandId}
                      onChange={updateTextField}
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

                  <ImageUploader
                    label="Thumbnail Image"
                    value={thumbnailItems}
                    onChange={setThumbnailItems}
                    maxFiles={1}
                  />

                  <AdminField
                    label="SKU"
                    name="sku"
                    value={form.sku}
                    onChange={updateTextField}
                    placeholder="SKU-1001"
                  />

                  <AdminField
                    label="Barcode"
                    name="barcode"
                    value={form.barcode}
                    onChange={updateTextField}
                    placeholder="123456789"
                  />

                  <AdminField
                    label="Display Order"
                    name="displayOrder"
                    value={form.displayOrder}
                    onChange={updateTextField}
                    placeholder="1"
                    inputMode="numeric"
                  />

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                      Category
                      <span className="ml-1 text-[var(--danger)]">*</span>
                    </span>

                    <select
                      name="categoryId"
                      value={form.categoryId}
                      onChange={updateTextField}
                      required
                      className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">Select category</option>

                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
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

                <ImageUploader
                  className="mt-4"
                  label="Gallery Images"
                  value={galleryItems}
                  onChange={setGalleryItems}
                  multiple
                  maxFiles={8}
                />

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
                          : current,
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
                          : current,
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
                          : current,
                      )
                    }
                  />
                  <AdminToggle
                    label="Show On Home"
                    description="Display on home page"
                    checked={form.showOnHome}
                    onChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              showOnHome: checked,
                            }
                          : current,
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
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search product, brand or category"
                  className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"
                />
              </label>

              <select
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value as ProductFilter);
                  setPage(1);
                }}
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

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <select
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--text-primary)] outline-none"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={brandId}
                onChange={(event) => {
                  setBrandId(event.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--text-primary)] outline-none"
              >
                <option value="">All brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as typeof sort);
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--text-primary)] outline-none"
              >
                <option value="display-order">Display order</option>
                <option value="newest">Newest</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="stock-asc">Stock: low to high</option>
                <option value="stock-desc">Stock: high to low</option>
              </select>
            </div>
          </section>

          {!hydrated ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-[24px] bg-white"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <section className="mt-5 flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center">
              <Boxes size={38} className="text-[var(--text-muted)]" />

              <h2 className="mt-4 text-xl font-black text-[var(--text-primary)]">
                No matching products
              </h2>

              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Try another search or product filter.
              </p>
            </section>
          ) : (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <AdminProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => openEditForm(product)}
                    onDelete={() => confirmDeleteProduct(product)}
                    onToggleActive={() =>
                      void updateToggle(product, { active: !product.active })
                    }
                    onToggleFeatured={() =>
                      void updateToggle(product, {
                        featured: !product.featured,
                      })
                    }
                    onToggleBestseller={() =>
                      void updateToggle(product, {
                        bestseller: !product.bestseller,
                      })
                    }
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="h-10 rounded-xl border border-[var(--border)] bg-white px-4 text-xs font-black text-[var(--text-secondary)] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="h-10 rounded-xl border border-[var(--border)] bg-white px-4 text-xs font-black text-[var(--text-secondary)] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </Container>
      </main>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-3xl border border-[var(--border)] bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div>
                <h2 className="text-lg font-black tracking-tight text-[var(--text-primary)]">
                  Bulk Product CSV Import
                </h2>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Upload a CSV file to import or update multiple products
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportResult(null);
                  setImportError("");
                  setImportSuccess("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Template Download & Options Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--border)] p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-[var(--text-primary)]">
                      CSV Template
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      Download our template to ensure headers match required and
                      optional fields.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadCsvTemplate}
                    className="mt-3 flex h-9 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-[10px] font-black text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                  >
                    <Download size={14} />
                    Download CSV Template
                  </button>
                </div>

                <div className="rounded-2xl border border-[var(--border)] p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-[var(--text-primary)]">
                      Duplicate SKU Behavior
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      Choose how to handle products whose SKUs already exist in
                      the catalog.
                    </p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDuplicateAction("skip")}
                      className={`flex-1 h-9 rounded-xl border text-[10px] font-black transition ${
                        duplicateAction === "skip"
                          ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                          : "bg-white border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
                      }`}
                    >
                      Skip Duplicates
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateAction("update")}
                      className={`flex-1 h-9 rounded-xl border text-[10px] font-black transition ${
                        duplicateAction === "update"
                          ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                          : "bg-white border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
                      }`}
                    >
                      Update Existing
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="relative border-2 border-dashed border-[var(--border)] rounded-2xl p-6 flex flex-col items-center justify-center bg-[var(--surface-soft)] hover:bg-[var(--surface-muted)] transition cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload size={32} className="text-[var(--text-muted)] mb-2" />
                <span className="text-xs font-black text-[var(--text-primary)]">
                  {importFile ? importFile.name : "Choose CSV File"}
                </span>
                <span className="text-[9px] text-[var(--text-muted)] mt-1">
                  Drag and drop or click to upload CSV (Max 5MB)
                </span>
              </div>

              {/* Error Alert */}
              {importError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 font-semibold">
                  {importError}
                </div>
              )}

              {/* Success Alert */}
              {importSuccess && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-xs text-green-700 font-bold">
                  {importSuccess}
                </div>
              )}

              {/* Validation Results Overview */}
              {importResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-[var(--surface-soft)] rounded-xl p-3 border border-[var(--border)]">
                      <span className="block text-lg font-black text-[var(--text-primary)]">
                        {importResult.totalRows}
                      </span>
                      <span className="block text-[8px] uppercase tracking-wider text-[var(--text-muted)] mt-0.5">
                        Total Rows
                      </span>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <span className="block text-lg font-black text-green-700">
                        {importResult.validCount}
                      </span>
                      <span className="block text-[8px] uppercase tracking-wider text-green-600 mt-0.5">
                        Valid
                      </span>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                      <span className="block text-lg font-black text-amber-700">
                        {importResult.duplicateCount}
                      </span>
                      <span className="block text-[8px] uppercase tracking-wider text-amber-600 mt-0.5">
                        Duplicates
                      </span>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                      <span className="block text-lg font-black text-red-700">
                        {importResult.invalidCount}
                      </span>
                      <span className="block text-[8px] uppercase tracking-wider text-red-600 mt-0.5">
                        Invalid
                      </span>
                    </div>
                  </div>

                  {/* Actions / Info Bar */}
                  {importResult.invalidCount > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-red-50/50 border border-red-100 px-4 py-3">
                      <span className="text-[10px] text-red-700 font-medium">
                        Contains {importResult.invalidCount} invalid rows. Fix
                        them or import valid rows.
                      </span>
                      <button
                        type="button"
                        onClick={downloadErrorCsv}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-[9px] font-black text-red-700 hover:bg-red-50"
                      >
                        <Download size={12} />
                        Download Error CSV
                      </button>
                    </div>
                  )}

                  {/* Preview Rows Table */}
                  <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[var(--surface-soft)] border-b border-[var(--border)] text-[10px] font-bold text-[var(--text-muted)]">
                          <th className="p-3 w-12 text-center">Row</th>
                          <th className="p-3 w-32">SKU</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3 w-24 text-center">Status</th>
                          <th className="p-3">Errors / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] font-medium text-[var(--text-primary)]">
                        {importResult.rows.map((row) => (
                          <tr
                            key={row.index}
                            className="hover:bg-[var(--surface-soft)]"
                          >
                            <td className="p-3 text-center text-[var(--text-muted)] font-mono text-[10px]">
                              {row.index}
                            </td>
                            <td className="p-3 font-mono text-[10px]">
                              {row.raw.sku || (
                                <em className="text-red-400 font-sans">None</em>
                              )}
                            </td>
                            <td className="p-3 truncate max-w-[180px]">
                              {row.raw.name || (
                                <em className="text-red-400">None</em>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${
                                  row.status === "valid"
                                    ? "bg-green-100 text-green-800"
                                    : row.status === "duplicate"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="p-3 text-[10px]">
                              {row.status === "invalid" ? (
                                <span className="text-red-600 font-semibold leading-normal">
                                  {row.errors.join("; ")}
                                </span>
                              ) : row.status === "duplicate" ? (
                                <span className="text-[var(--text-muted)]">
                                  {duplicateAction === "skip"
                                    ? "Will be skipped"
                                    : "Will overwrite existing"}
                                </span>
                              ) : (
                                <span className="text-green-600 font-semibold">
                                  Ready to import
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4 bg-[var(--surface-soft)]">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportResult(null);
                  setImportError("");
                  setImportSuccess("");
                }}
                className="h-10 rounded-xl border border-[var(--border)] bg-white px-4 text-xs font-black text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isImporting ||
                  !importResult ||
                  (importResult.validCount === 0 &&
                    !(
                      duplicateAction === "update" &&
                      importResult.duplicateCount > 0
                    ))
                }
                onClick={handleConfirmImport}
                className="h-10 rounded-xl bg-[var(--primary)] px-5 text-xs font-black text-white disabled:opacity-50"
              >
                {isImporting ? "Importing..." : "Confirm & Import"}
              </button>
            </div>
          </div>
        </div>
      )}
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
  product: AdminProduct;
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
        product.active ? "border-[var(--border)]" : "border-red-200 opacity-80"
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
          value={product.rating?.toFixed(1) ?? "—"}
        />

        <ProductMetric
          label="Delivery"
          value={
            product.deliveryMinutes === undefined
              ? "—"
              : `${product.deliveryMinutes}m`
          }
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
          <Star size={12} fill={product.featured ? "currentColor" : "none"} />
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

        <Link
          href={`/admin/products/${product.id}/edit`}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--primary)] text-[10px] font-black text-[var(--primary)] hover:bg-emerald-50/40"
        >
          <Pencil size={14} />
          Edit
        </Link>

        <button
          type="button"
          onClick={onToggleActive}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[10px] font-black ${
            product.active
              ? "bg-red-50 text-[var(--danger)]"
              : "bg-green-50 text-[var(--success)]"
          }`}
        >
          {product.active ? <EyeOff size={14} /> : <Eye size={14} />}

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
          warning ? "text-[var(--danger)]" : "text-[var(--text-primary)]"
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
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--surface-muted)] transition peer-checked:bg-[var(--primary)]">
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
