"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Search,
} from "lucide-react";

import { useAccount } from "@/hooks/useAccount";

type CollectionHub =
  | "beauty"
  | "electronics"
  | "pharmacy"
  | "decor"
  | "kids"
  | "gifting";

type BrandItem = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  active: boolean;
  collectionHub?: string | null;
};

export default function HeaderHubBrandManager({
  selectedHub,
}: {
  selectedHub: CollectionHub;
}) {
  const { session } = useAccount();
  const accessToken = session?.accessToken || "";

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "/api"
  ).replace(/\/$/, "");

  useEffect(() => {
    if (!accessToken) return;

    const controller = new AbortController();

    const loadBrands = async () => {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `${apiBase}/admin/brands?limit=100`,
          {
            cache: "no-store",
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const payload = (await response.json()) as {
          success?: boolean;
          message?: string;
          data?: {
            brands?: BrandItem[];
          };
        };

        if (
          !response.ok ||
          !payload.success ||
          !Array.isArray(payload.data?.brands)
        ) {
          throw new Error(
            payload.message || "Unable to load brands.",
          );
        }

        setBrands(payload.data.brands);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load brands.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadBrands();

    return () => controller.abort();
  }, [accessToken, apiBase, selectedHub]);

  const filteredBrands = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return brands;

    return brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(value) ||
        brand.slug.toLowerCase().includes(value),
    );
  }, [brands, query]);

  const selectedCount = brands.filter(
    (brand) => brand.collectionHub === selectedHub,
  ).length;

  const updateBrandHub = async (brand: BrandItem) => {
    const brandId = brand.id || brand._id;

    if (!brandId || updatingId) return;

    const currentlySelected =
      brand.collectionHub === selectedHub;

    const nextHub = currentlySelected
      ? null
      : selectedHub;

    setUpdatingId(brandId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${apiBase}/admin/brands/${brandId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collectionHub: nextHub,
          }),
        },
      );

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message || "Unable to update brand.",
        );
      }

      setBrands((current) =>
        current.map((item) =>
          (item.id || item._id) === brandId
            ? { ...item, collectionHub: nextHub }
            : item,
        ),
      );

      setMessage(
        currentlySelected
          ? `${brand.name} removed from ${selectedHub}.`
          : `${brand.name} added to ${selectedHub}.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update brand.",
      );
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <section className="mt-6 rounded-3xl border border-[var(--border)] bg-white p-5">
      <div>
        <h2 className="text-lg font-black">
          Brand Stores
        </h2>

        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {selectedCount} brands selected for {selectedHub}
        </p>
      </div>

      <label className="mt-4 flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] px-4">
        <Search size={17} className="text-[var(--text-muted)]" />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search brand"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </label>

      {message ? (
        <p className="mt-3 text-xs font-bold text-[var(--success)]">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs font-bold text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2
            size={22}
            className="animate-spin text-[var(--primary)]"
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {filteredBrands.map((brand) => {
            const brandId = brand.id || brand._id || brand.slug;
            const selected =
              brand.collectionHub === selectedHub;
            const updating = updatingId === brandId;

            return (
              <button
                key={brandId}
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() => void updateBrandHub(brand)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left ${
                  selected
                    ? "border-[var(--primary)] bg-[var(--primary-light)]"
                    : "border-[var(--border)] bg-white"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-soft)]">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-sm font-black">
                      {brand.name.charAt(0)}
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">
                    {brand.name}
                  </span>

                  <span className="mt-1 block text-[10px] text-[var(--text-muted)]">
                    {brand.slug}
                    {!brand.active ? " · Inactive" : ""}
                  </span>

                  {brand.collectionHub &&
                  brand.collectionHub !== selectedHub ? (
                    <span className="mt-1 block text-[10px] font-bold text-amber-600">
                      Currently in {brand.collectionHub}
                    </span>
                  ) : null}
                </span>

                {updating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : selected ? (
                  <CheckCircle2
                    size={20}
                    className="text-[var(--primary)]"
                  />
                ) : (
                  <span className="h-5 w-5 rounded-full border-2 border-[var(--border)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}