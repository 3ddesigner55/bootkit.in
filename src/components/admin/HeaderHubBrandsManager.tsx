"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Building2,
  GripVertical,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

type CollectionHub =
  | "beauty"
  | "electronics"
  | "pharmacy"
  | "decor"
  | "kids"
  | "gifting";

type BrandItem = {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  active: boolean;
  featured?: boolean;
  displayOrder?: number;
  collectionHub?: string | null;
};

type Props = {
  hub: CollectionHub;
  apiBase: string;
  accessToken: string;
};

function getBrandId(brand: BrandItem): string {
  return brand.id || brand._id || "";
}

function arraysMatch(
  first: string[],
  second: string[],
): boolean {
  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
}

export default function HeaderHubBrandsManager({
  hub,
  apiBase,
  accessToken,
}: Props) {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [savedBrandIds, setSavedBrandIds] =
    useState<string[]>([]);

  const [draftBrandIds, setDraftBrandIds] =
    useState<string[]>([]);

  const [query, setQuery] = useState("");
  const [draggedId, setDraggedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBrands = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${apiBase}/admin/brands?page=1&limit=100`,
        {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const payload = await response.json();
      const data = payload?.data ?? payload;

      const nextBrands = Array.isArray(data?.brands)
        ? data.brands
        : Array.isArray(data)
          ? data
          : [];

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || "Unable to load brands.",
        );
      }

      setBrands(nextBrands);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load brands.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiBase]);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    const selectedIds = brands
      .filter((brand) => brand.collectionHub === hub)
      .sort(
        (first, second) =>
          (first.displayOrder ?? 0) -
          (second.displayOrder ?? 0),
      )
      .map(getBrandId)
      .filter(Boolean);

    setSavedBrandIds(selectedIds);
    setDraftBrandIds(selectedIds);
  }, [brands, hub]);

  useEffect(() => {
    setQuery("");
    setDraggedId("");
    setError("");
    setMessage("");
  }, [hub]);

  const brandsById = useMemo(
    () =>
      new Map(
        brands.map((brand) => [
          getBrandId(brand),
          brand,
        ]),
      ),
    [brands],
  );

  const selectedBrandSet = useMemo(
    () => new Set(draftBrandIds),
    [draftBrandIds],
  );

  const selectedBrands = useMemo(
    () =>
      draftBrandIds
        .map((brandId) => brandsById.get(brandId))
        .filter(
          (brand): brand is BrandItem =>
            Boolean(brand),
        ),
    [brandsById, draftBrandIds],
  );

  const availableBrands = useMemo(() => {
    const value = query.trim().toLowerCase();

    return brands.filter((brand) => {
      const brandId = getBrandId(brand);

      if (selectedBrandSet.has(brandId)) {
        return false;
      }

      if (!value) return true;

      return (
        brand.name.toLowerCase().includes(value) ||
        brand.slug.toLowerCase().includes(value)
      );
    });
  }, [brands, query, selectedBrandSet]);

  const hasChanges = !arraysMatch(
    savedBrandIds,
    draftBrandIds,
  );

  const addBrand = (brandId: string) => {
    setDraftBrandIds((current) =>
      current.includes(brandId)
        ? current
        : [...current, brandId],
    );

    setError("");
    setMessage("");
  };

  const removeBrand = (brandId: string) => {
    setDraftBrandIds((current) =>
      current.filter((id) => id !== brandId),
    );

    setError("");
    setMessage("");
  };

  const dropIntoSelected = (
    targetBrandId?: string,
  ) => {
    if (!draggedId) return;

    setDraftBrandIds((current) => {
      const next = current.filter(
        (brandId) => brandId !== draggedId,
      );

      const targetIndex = targetBrandId
        ? next.indexOf(targetBrandId)
        : -1;

      next.splice(
        targetIndex >= 0 ? targetIndex : next.length,
        0,
        draggedId,
      );

      return next;
    });

    setDraggedId("");
    setError("");
    setMessage("");
  };

  const dropIntoAvailable = () => {
    if (!draggedId) return;

    removeBrand(draggedId);
    setDraggedId("");
  };

  const discardChanges = () => {
    setDraftBrandIds(savedBrandIds);
    setError("");
    setMessage("Unsaved brand changes discarded.");
  };

  const saveChanges = async () => {
    if (!accessToken || !hasChanges || saving) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const desiredOrder = new Map(
      draftBrandIds.map((brandId, index) => [
        brandId,
        index + 1,
      ]),
    );

    const updates: Array<{
      brandId: string;
      body: Record<string, unknown>;
    }> = [];

    brands.forEach((brand) => {
      const brandId = getBrandId(brand);
      const nextOrder = desiredOrder.get(brandId);

      if (nextOrder !== undefined) {
        if (
          brand.collectionHub !== hub ||
          (brand.displayOrder ?? 0) !== nextOrder
        ) {
          updates.push({
            brandId,
            body: {
              collectionHub: hub,
              displayOrder: nextOrder,
            },
          });
        }

        return;
      }

      if (brand.collectionHub === hub) {
        updates.push({
          brandId,
          body: {
            collectionHub: null,
          },
        });
      }
    });

    try {
      for (const update of updates) {
        const response = await fetch(
          `${apiBase}/admin/brands/${update.brandId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(update.body),
          },
        );

        const payload = await response
          .json()
          .catch(() => null);

        if (
          !response.ok ||
          payload?.success === false
        ) {
          throw new Error(
            payload?.message ||
              "Unable to save brand changes.",
          );
        }
      }

      await loadBrands();

      setMessage(
        `${updates.length} brand changes saved for ${hub}.`,
      );
    } catch (requestError) {
      await loadBrands();

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save brand changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2
          size={24}
          className="animate-spin text-[var(--primary)]"
        />
      </div>
    );
  }

  return (
    <section className="pt-5">
      {message ? (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section
          onDragOver={(event) =>
            event.preventDefault()
          }
          onDrop={(event) => {
            event.preventDefault();
            dropIntoAvailable();
          }}
          className="overflow-hidden rounded-2xl border border-[var(--border)]"
        >
          <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <h2 className="text-sm font-black uppercase tracking-wide">
              Available Brands
            </h2>

            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Click + or drag a brand to the selected pane.
            </p>

            <label className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3">
              <Search
                size={16}
                className="text-[var(--text-muted)]"
              />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search brands"
                className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              />
            </label>
          </div>

          <div className="max-h-[520px] space-y-2 overflow-y-auto p-3">
            {availableBrands.map((brand) => {
              const brandId = getBrandId(brand);

              return (
                <article
                  key={brandId}
                  draggable={!saving}
                  onDragStart={() =>
                    setDraggedId(brandId)
                  }
                  onDragEnd={() => setDraggedId("")}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3"
                >
                  <GripVertical
                    size={17}
                    className="shrink-0 cursor-grab text-[var(--text-muted)]"
                  />

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-soft)]">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Building2
                        size={18}
                        className="text-[var(--text-muted)]"
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-black">
                      {brand.name}
                    </span>

                    <span className="mt-1 block text-[9px] text-[var(--text-muted)]">
                      {brand.slug}
                      {!brand.active ? " · Inactive" : ""}
                    </span>

                    {brand.collectionHub &&
                    brand.collectionHub !== hub ? (
                      <span className="mt-1 block text-[9px] font-bold text-amber-600">
                        Currently in {brand.collectionHub}
                      </span>
                    ) : null}
                  </span>

                  <button
                    type="button"
                    onClick={() => addBrand(brandId)}
                    aria-label={`Add ${brand.name}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]"
                  >
                    <Plus size={16} />
                  </button>
                </article>
              );
            })}

            {!availableBrands.length ? (
              <p className="py-12 text-center text-xs font-semibold text-[var(--text-muted)]">
                No available brands found.
              </p>
            ) : null}
          </div>
        </section>

        <section
          onDragOver={(event) =>
            event.preventDefault()
          }
          onDrop={(event) => {
            event.preventDefault();
            dropIntoSelected();
          }}
          className="overflow-hidden rounded-2xl border border-[var(--primary)]"
        >
          <div className="border-b border-[var(--border)] bg-[var(--primary-light)] p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--primary)]">
              Selected for {hub}
            </h2>

            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Drag cards to set brand display order.
            </p>
          </div>

          <div className="max-h-[520px] min-h-[220px] space-y-2 overflow-y-auto p-3">
            {selectedBrands.map((brand, index) => {
              const brandId = getBrandId(brand);

              return (
                <article
                  key={brandId}
                  draggable={!saving}
                  onDragStart={() =>
                    setDraggedId(brandId)
                  }
                  onDragEnd={() => setDraggedId("")}
                  onDragOver={(event) =>
                    event.preventDefault()
                  }
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropIntoSelected(brandId);
                  }}
                  className="flex items-center gap-3 rounded-xl border border-[var(--primary)] bg-[var(--primary-light)] p-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-[10px] font-black text-white">
                    {index + 1}
                  </span>

                  <GripVertical
                    size={17}
                    className="shrink-0 cursor-grab text-[var(--primary)]"
                  />

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Building2
                        size={18}
                        className="text-[var(--text-muted)]"
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-black">
                      {brand.name}
                    </span>

                    <span className="mt-1 block text-[9px] text-[var(--text-muted)]">
                      {brand.slug}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => removeBrand(brandId)}
                    aria-label={`Remove ${brand.name}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--danger)]"
                  >
                    <X size={15} />
                  </button>
                </article>
              );
            })}

            {!selectedBrands.length ? (
              <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-center">
                <Building2
                  size={26}
                  className="text-[var(--text-muted)]"
                />

                <p className="mt-3 text-xs font-black">
                  No selected brands
                </p>

                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  Add or drag brands from the left pane.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-5 flex justify-end gap-3 border-t border-[var(--border)] pt-5">
        <button
          type="button"
          disabled={!hasChanges || saving}
          onClick={discardChanges}
          className="h-11 rounded-xl border border-[var(--border)] px-5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Discard
        </button>

        <button
          type="button"
          disabled={!hasChanges || saving}
          onClick={() => void saveChanges()}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : null}

          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </section>
  );
}