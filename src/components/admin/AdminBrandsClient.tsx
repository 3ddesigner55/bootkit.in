"use client";

import { Pencil, Plus, RefreshCw, Save, Tag, Trash2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import {
  ImageUploader,
  type ImageUploaderItem,
} from "@/components/admin/media";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { useAccount } from "@/hooks/useAccount";
import {
  createAdminBrand,
  deleteAdminBrand,
  getAdminBrands,
  updateAdminBrand,
  uploadAdminBrandImages,
} from "@/services/adminBrands.service";
import type { Brand } from "@/types/brand";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminFilterBar from "@/components/admin/ui/AdminFilterBar";
import AdminLoadingSkeleton from "@/components/admin/ui/AdminLoadingSkeleton";
import AdminPagination from "@/components/admin/ui/AdminPagination";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminPrimaryButton from "@/components/admin/ui/AdminPrimaryButton";
import AdminSearchBar from "@/components/admin/ui/AdminSearchBar";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";

type Form = {
  name: string;
  slug: string;
  logo: string;
  banner: string;
  collectionHub: string;
  description: string;
  active: boolean;
};

const empty: Form = {
  name: "",
  slug: "",
  logo: "🏷️",
  banner: "",
  collectionHub: "",
  description: "",
  active: true,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type ActiveFilter = "All" | "Active" | "Inactive";
type FeaturedFilter = "All" | "Featured" | "Not featured";
type BrandSort = "displayOrder" | "name" | "createdAt";

const activeFilterOptions: { label: string; value: ActiveFilter }[] = [
  { label: "All", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

const featuredFilterOptions: { label: string; value: FeaturedFilter }[] = [
  { label: "All brands", value: "All" },
  { label: "Featured", value: "Featured" },
  { label: "Not featured", value: "Not featured" },
];

const sortOptions: { label: string; value: BrandSort }[] = [
  { label: "Display order", value: "displayOrder" },
  { label: "Name", value: "name" },
  { label: "Newest", value: "createdAt" },
];

function isUploadUrl(value: string) {
  return (
    value.startsWith("blob:") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  );
}

export default function AdminBrandsClient() {
  const { products } = useAdminProducts();
  const { hydrated: accountHydrated, session } = useAccount();
  const accessToken = session?.accessToken;
  const [brands, setBrands] = useState<Brand[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("All");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>("All");
  const [sort, setSort] = useState<BrandSort>("displayOrder");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadBrands = useCallback(async () => {
    if (!accessToken) {
      setBrands([]);
      setHydrated(true);
      return;
    }
    try {
      const data = await getAdminBrands(accessToken, {
        page,
        limit: 12,
        search: query,
        active: activeFilter === "All" ? undefined : activeFilter === "Active",
        featured:
          featuredFilter === "All" ? undefined : featuredFilter === "Featured",
        sort,
      });
      setBrands(data.brands);
      setTotalPages(data.pagination.totalPages);
      setError("");
    } catch (loadError) {
      setBrands([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Brands could not be loaded.",
      );
    } finally {
      setHydrated(true);
    }
  }, [accessToken, activeFilter, featuredFilter, page, query, sort]);

  useEffect(() => {
    if (accountHydrated) void loadBrands();
  }, [accountHydrated, loadBrands]);

  useEffect(() => {
    setPage(1);
  }, [query, activeFilter, featuredFilter, sort]);

  const start = (brand?: Brand) => {
    setEditing(brand ?? null);
    setForm(
      brand
        ? {
            name: brand.name,
            slug: brand.slug,
            logo: brand.logo,
            banner: brand.banner ?? "",
            collectionHub: brand.collectionHub ?? "",
            description: brand.description,
            active: brand.active,
          }
        : empty,
    );
    setError("");
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    if (form.name.trim().length < 2)
      return setError("Brand name कम से कम 2 अक्षर का होना चाहिए।");
    if (form.description.trim().length < 5)
      return setError("Brand description कम से कम 5 अक्षर का होना चाहिए।");
    if (!accessToken)
      return setError("Your admin session has expired. Please sign in again.");

    const data = {
      ...form,
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      logo: form.logo.trim() || "🏷️",
      banner: form.banner.trim() || "",
      collectionHub: form.collectionHub
        ? (form.collectionHub as Brand["collectionHub"])
        : null,
      description: form.description.trim(),
    };

    try {
      if (editing) await updateAdminBrand(accessToken, editing.id, data);
      else await createAdminBrand(accessToken, data);
      setForm(null);
      setEditing(null);
      await loadBrands();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Brand could not be saved.",
      );
    }
  };

  const updateLogo = async (items: ImageUploaderItem[]) => {
    const item = items[0];
    if (!item) {
      setForm((current) => (current ? { ...current, logo: "" } : current));
      return;
    }
    if (!item.file) {
      setForm((current) =>
        current ? { ...current, logo: item.url } : current,
      );
      return;
    }
    if (!accessToken)
      return setError("Your admin session has expired. Please sign in again.");
    try {
      const uploaded = await uploadAdminBrandImages(accessToken, {
        logo: item.file,
      });
      setForm((current) =>
        current ? { ...current, logo: uploaded.logo || "" } : current,
      );
      setError("");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Brand logo could not be uploaded.",
      );
    }
  };

  const updateBanner = async (items: ImageUploaderItem[]) => {
    const item = items[0];
    if (!item) {
      setForm((current) => (current ? { ...current, banner: "" } : current));
      return;
    }
    if (!item.file) {
      setForm((current) =>
        current ? { ...current, banner: item.url } : current,
      );
      return;
    }
    if (!accessToken)
      return setError("Your admin session has expired. Please sign in again.");
    try {
      const uploaded = await uploadAdminBrandImages(accessToken, {
        banner: item.file,
      });
      setForm((current) =>
        current ? { ...current, banner: uploaded.banner || "" } : current,
      );
      setError("");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Brand banner could not be uploaded.",
      );
    }
  };

  const removeBrand = async (brand: Brand, count: number) => {
    if (count || !window.confirm(`Delete ${brand.name}?`)) return;
    if (!accessToken)
      return setError("Your admin session has expired. Please sign in again.");
    try {
      await deleteAdminBrand(accessToken, brand.id);
      await loadBrands();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Brand could not be deleted.",
      );
    }
  };

  const toggleBrand = async (brand: Brand) => {
    if (!accessToken)
      return setError("Your admin session has expired. Please sign in again.");
    try {
      await updateAdminBrand(accessToken, brand.id, { active: !brand.active });
      await loadBrands();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Brand status could not be updated.",
      );
    }
  };

  const brandCards = useMemo(
    () =>
      brands.map((brand) => ({
        brand,
        count: products.filter((product) => product.brand === brand.name)
          .length,
      })),
    [brands, products],
  );

  if (!hydrated)
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <Container className="py-8">
          <AdminLoadingSkeleton variant="page" />
        </Container>
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main>
        <Container className="py-5 sm:py-8">
          <AdminPageHeader
            title="Brand management"
            description="Brands और product association manage करें"
            action={
              <AdminPrimaryButton
                icon={<Plus size={15} />}
                onClick={() => start()}
              >
                Add brand
              </AdminPrimaryButton>
            }
          />
          {form && (
            <form
              onSubmit={save}
              className="mb-5 rounded-3xl border border-[var(--primary)] bg-white p-5 shadow-[var(--shadow-sm)]"
            >
              <div className="mb-4 flex justify-between">
                <h2 className="text-lg font-black">
                  {editing ? "Edit brand" : "Add brand"}
                </h2>
                <button type="button" onClick={() => setForm(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold">
                    Brand name
                  </span>
                  <input
                    value={form.name}
                    placeholder="BootKiT Fresh"
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? { ...current, name: event.target.value }
                          : current,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold">Slug</span>
                  <input
                    value={form.slug}
                    placeholder="bootkit-fresh"
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? { ...current, slug: slugify(event.target.value) }
                          : current,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold">
                    Collection Hub
                  </span>
                  <select
                    value={form.collectionHub}
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? { ...current, collectionHub: event.target.value }
                          : current,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold outline-none focus:border-[var(--primary)]"
                  >
                    <option value="">None / All Hubs</option>
                    <option value="beauty">Beauty</option>
                    <option value="electronics">Electronics</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="decor">Decor</option>
                    <option value="kids">Kids</option>
                    <option value="gifting">Gifting</option>
                  </select>
                </label>

                <label className="block sm:col-span-2 lg:col-span-3">
                  <span className="mb-1 block text-xs font-bold">
                    Description
                  </span>
                  <input
                    value={form.description}
                    placeholder="Fresh everyday essentials"
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? { ...current, description: event.target.value }
                          : current,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ImageUploader
                  label="Brand Logo"
                  value={
                    isUploadUrl(form.logo)
                      ? [
                          {
                            id: "brand-logo",
                            url: form.logo,
                            name: "Brand logo",
                            progress: form.logo.startsWith("blob:") ? 0 : 100,
                            status: form.logo.startsWith("blob:")
                              ? "ready"
                              : "uploaded",
                          },
                        ]
                      : []
                  }
                  onChange={(items) => {
                    void updateLogo(items);
                  }}
                />

                <ImageUploader
                  label="Promotional Banner Artwork (Optional)"
                  value={
                    isUploadUrl(form.banner)
                      ? [
                          {
                            id: "brand-banner",
                            url: form.banner,
                            name: "Brand banner",
                            progress: form.banner.startsWith("blob:") ? 0 : 100,
                            status: form.banner.startsWith("blob:")
                              ? "ready"
                              : "uploaded",
                          },
                        ]
                      : []
                  }
                  onChange={(items) => {
                    void updateBanner(items);
                  }}
                />
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? { ...current, active: event.target.checked }
                        : current,
                    )
                  }
                />
                Active brand
              </label>

              {error && (
                <p className="mt-3 text-xs font-bold text-[var(--danger)]">
                  {error}
                </p>
              )}

              <AdminPrimaryButton
                type="submit"
                icon={<Save size={16} />}
                className="mt-4 h-11 text-sm"
              >
                Save brand
              </AdminPrimaryButton>
            </form>
          )}

          <section className="mb-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <AdminSearchBar
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search brands"
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as BrandSort)}
                className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <AdminFilterBar
              options={activeFilterOptions}
              value={activeFilter}
              onChange={setActiveFilter}
              ariaLabel="Brand status"
            />
            <AdminFilterBar
              options={featuredFilterOptions}
              value={featuredFilter}
              onChange={setFeaturedFilter}
              ariaLabel="Brand featured status"
            />
          </section>

          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
                if (window.confirm("Reset all local brands?"))
                  void loadBrands();
              }}
              className="flex items-center gap-2 text-xs font-bold text-[var(--danger)]"
            >
              <RefreshCw size={14} />
              Reset brands
            </button>
          </div>

          {brandCards.length === 0 ? (
            <AdminEmptyState
              title="No brands yet"
              description="Add a brand to organize product associations."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {brandCards.map(({ brand, count }) => (
                <article
                  key={brand.id}
                  className="rounded-2xl border border-[var(--border)] bg-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{brand.logo}</span>
                    <div className="flex items-center gap-1.5">
                      {brand.collectionHub && (
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[9px] font-black uppercase text-purple-700">
                          {brand.collectionHub}
                        </span>
                      )}
                      <AdminStatusBadge
                        label={brand.active ? "Active" : "Inactive"}
                        tone={brand.active ? "success" : "neutral"}
                      />
                    </div>
                  </div>
                  <h2 className="mt-3 font-black text-[var(--text-primary)]">
                    {brand.name}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {brand.description}
                  </p>
                  <p className="mt-3 flex items-center gap-1 text-xs font-bold text-[var(--primary)]">
                    <Tag size={13} />
                    {count} products
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => start(brand)}
                      className="rounded-lg border border-[var(--border)] p-2"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => void toggleBrand(brand)}
                      className="rounded-lg border border-[var(--border)] px-3 text-xs font-bold"
                    >
                      {brand.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => void removeBrand(brand, count)}
                      disabled={count > 0}
                      className="rounded-lg border border-red-100 p-2 text-[var(--danger)] disabled:opacity-30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            />
          )}
        </Container>
      </main>
    </div>
  );
}
