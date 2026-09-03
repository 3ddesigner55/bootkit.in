"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  GripVertical,
  ImageIcon,
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

type BannerItem = {
  id?: string;
  _id?: string;
  title: string;
  subtitle?: string;
  desktopImage?: string;
  mobileImage?: string;
  active: boolean;
  displayOrder?: number;
  collectionHub?: string | null;
};

type Props = {
  hub: CollectionHub;
  apiBase: string;
  accessToken: string;
};

function getBannerId(banner: BannerItem): string {
  return banner.id || banner._id || "";
}

function getBannerImage(banner: BannerItem): string {
  return banner.mobileImage || banner.desktopImage || "";
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

export default function HeaderHubBannersManager({
  hub,
  apiBase,
  accessToken,
}: Props) {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [savedBannerIds, setSavedBannerIds] =
    useState<string[]>([]);

  const [draftBannerIds, setDraftBannerIds] =
    useState<string[]>([]);

  const [query, setQuery] = useState("");
  const [draggedId, setDraggedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBanners = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${apiBase}/admin/hero-banners`,
        {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const payload = await response.json();
      const data = payload?.data ?? payload;

      const nextBanners = Array.isArray(data)
        ? data
        : Array.isArray(data?.heroBanners)
          ? data.heroBanners
          : [];

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || "Unable to load banners.",
        );
      }

      setBanners(nextBanners);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load banners.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiBase]);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    const selectedIds = banners
      .filter(
        (banner) => banner.collectionHub === hub,
      )
      .sort(
        (first, second) =>
          (first.displayOrder ?? 0) -
          (second.displayOrder ?? 0),
      )
      .map(getBannerId)
      .filter(Boolean);

    setSavedBannerIds(selectedIds);
    setDraftBannerIds(selectedIds);
  }, [banners, hub]);

  useEffect(() => {
    setQuery("");
    setDraggedId("");
    setError("");
    setMessage("");
  }, [hub]);

  const bannersById = useMemo(
    () =>
      new Map(
        banners.map((banner) => [
          getBannerId(banner),
          banner,
        ]),
      ),
    [banners],
  );

  const selectedBannerSet = useMemo(
    () => new Set(draftBannerIds),
    [draftBannerIds],
  );

  const selectedBanners = useMemo(
    () =>
      draftBannerIds
        .map((bannerId) =>
          bannersById.get(bannerId),
        )
        .filter(
          (banner): banner is BannerItem =>
            Boolean(banner),
        ),
    [bannersById, draftBannerIds],
  );

  const availableBanners = useMemo(() => {
    const value = query.trim().toLowerCase();

    return banners.filter((banner) => {
      const bannerId = getBannerId(banner);

      if (selectedBannerSet.has(bannerId)) {
        return false;
      }

      if (!value) return true;

      return (
        banner.title.toLowerCase().includes(value) ||
        (banner.subtitle || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [banners, query, selectedBannerSet]);

  const hasChanges = !arraysMatch(
    savedBannerIds,
    draftBannerIds,
  );

  const addBanner = (bannerId: string) => {
    setDraftBannerIds((current) =>
      current.includes(bannerId)
        ? current
        : [...current, bannerId],
    );

    setError("");
    setMessage("");
  };

  const removeBanner = (bannerId: string) => {
    setDraftBannerIds((current) =>
      current.filter((id) => id !== bannerId),
    );

    setError("");
    setMessage("");
  };

  const dropIntoSelected = (
    targetBannerId?: string,
  ) => {
    if (!draggedId) return;

    setDraftBannerIds((current) => {
      const next = current.filter(
        (bannerId) => bannerId !== draggedId,
      );

      const targetIndex = targetBannerId
        ? next.indexOf(targetBannerId)
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

    removeBanner(draggedId);
    setDraggedId("");
  };

  const discardChanges = () => {
    setDraftBannerIds(savedBannerIds);
    setError("");
    setMessage("Unsaved banner changes discarded.");
  };

  const saveChanges = async () => {
    if (!accessToken || !hasChanges || saving) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const desiredOrder = new Map(
      draftBannerIds.map((bannerId, index) => [
        bannerId,
        index + 1,
      ]),
    );

    const updates: Array<{
      bannerId: string;
      body: Record<string, unknown>;
    }> = [];

    banners.forEach((banner) => {
      const bannerId = getBannerId(banner);
      const nextOrder = desiredOrder.get(bannerId);

      if (nextOrder !== undefined) {
        if (
          banner.collectionHub !== hub ||
          (banner.displayOrder ?? 0) !== nextOrder
        ) {
          updates.push({
            bannerId,
            body: {
              collectionHub: hub,
              displayOrder: nextOrder,
            },
          });
        }

        return;
      }

      if (banner.collectionHub === hub) {
        updates.push({
          bannerId,
          body: {
            collectionHub: null,
          },
        });
      }
    });

    try {
      for (const update of updates) {
        const response = await fetch(
          `${apiBase}/admin/hero-banners/${update.bannerId}`,
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
              "Unable to save banner changes.",
          );
        }
      }

      await loadBanners();

      setMessage(
        `${updates.length} banner changes saved for ${hub}.`,
      );
    } catch (requestError) {
      await loadBanners();

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save banner changes.",
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
              Available Banners
            </h2>

            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Click + or drag a banner to the selected pane.
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
                placeholder="Search banners"
                className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              />
            </label>
          </div>

          <div className="max-h-[520px] space-y-3 overflow-y-auto p-3">
            {availableBanners.map((banner) => {
              const bannerId = getBannerId(banner);
              const image = getBannerImage(banner);

              return (
                <article
                  key={bannerId}
                  draggable={!saving}
                  onDragStart={() =>
                    setDraggedId(bannerId)
                  }
                  onDragEnd={() => setDraggedId("")}
                  className="overflow-hidden rounded-xl border border-[var(--border)] bg-white"
                >
                  <div className="relative h-28 overflow-hidden bg-[var(--surface-soft)]">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon
                          size={26}
                          className="text-[var(--text-muted)]"
                        />
                      </div>
                    )}

                    <span className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90">
                      <GripVertical
                        size={16}
                        className="cursor-grab text-[var(--text-muted)]"
                      />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black">
                        {banner.title}
                      </span>

                      <span className="mt-1 block truncate text-[9px] text-[var(--text-muted)]">
                        {banner.subtitle || "No subtitle"}
                        {!banner.active ? " · Inactive" : ""}
                      </span>

                      {banner.collectionHub &&
                      banner.collectionHub !== hub ? (
                        <span className="mt-1 block text-[9px] font-bold text-amber-600">
                          Currently in {banner.collectionHub}
                        </span>
                      ) : null}
                    </span>

                    <button
                      type="button"
                      onClick={() => addBanner(bannerId)}
                      aria-label={`Add ${banner.title}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </article>
              );
            })}

            {!availableBanners.length ? (
              <p className="py-12 text-center text-xs font-semibold text-[var(--text-muted)]">
                No available banners found.
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
              Drag banners to set carousel display order.
            </p>
          </div>

          <div className="max-h-[520px] min-h-[220px] space-y-3 overflow-y-auto p-3">
            {selectedBanners.map((banner, index) => {
              const bannerId = getBannerId(banner);
              const image = getBannerImage(banner);

              return (
                <article
                  key={bannerId}
                  draggable={!saving}
                  onDragStart={() =>
                    setDraggedId(bannerId)
                  }
                  onDragEnd={() => setDraggedId("")}
                  onDragOver={(event) =>
                    event.preventDefault()
                  }
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropIntoSelected(bannerId);
                  }}
                  className="overflow-hidden rounded-xl border border-[var(--primary)] bg-[var(--primary-light)]"
                >
                  <div className="relative h-28 overflow-hidden bg-white">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon
                          size={26}
                          className="text-[var(--text-muted)]"
                        />
                      </div>
                    )}

                    <span className="absolute left-2 top-2 flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg bg-[var(--primary)] px-2 text-[10px] font-black text-white">
                      {index + 1}
                      <GripVertical size={14} />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black">
                        {banner.title}
                      </span>

                      <span className="mt-1 block truncate text-[9px] text-[var(--text-muted)]">
                        {banner.subtitle || "No subtitle"}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeBanner(bannerId)
                      }
                      aria-label={`Remove ${banner.title}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--danger)]"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </article>
              );
            })}

            {!selectedBanners.length ? (
              <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-center">
                <ImageIcon
                  size={26}
                  className="text-[var(--text-muted)]"
                />

                <p className="mt-3 text-xs font-black">
                  No selected banners
                </p>

                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  Add or drag banners from the left pane.
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