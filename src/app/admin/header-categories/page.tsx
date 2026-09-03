"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Building2,
  FolderTree,
  GripVertical,
  ImageIcon,
  Loader2,
  Plus,
  Search,
  Smartphone,
  X,
} from "lucide-react";

import HeaderHubBannersManager from "@/components/admin/HeaderHubBannersManager";
import HeaderHubBrandsManager from "@/components/admin/HeaderHubBrandsManager";
import HeaderHubProductsPreview from "@/components/admin/HeaderHubProductsPreview";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import HeaderNavigationManager from "@/components/admin/HeaderNavigationManager";
import HeaderHubBrandManager from "@/components/admin/HeaderHubBrandManager";

type CollectionHub =
  | "beauty"
  | "electronics"
  | "pharmacy"
  | "decor"
  | "kids"
  | "gifting";

type WorkspaceTab =
  | "categories"
  | "brands"
  | "banners"
  | "preview";

type CategoryTreeNode = {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  image?: string;
  active: boolean;
  sortOrder?: number;
  collectionHub?: string | null;
  children?: CategoryTreeNode[];
};

type FlatCategory = CategoryTreeNode & {
  resolvedId: string;
  depth: number;
};

const COLLECTIONS: Array<{
  slug: CollectionHub;
  label: string;
  icon: string;
}> = [
  {
    slug: "beauty",
    label: "Beauty",
    icon: "/icons/categories/Beauty.svg",
  },
  {
    slug: "electronics",
    label: "Electronics",
    icon: "/icons/categories/electronics.svg",
  },
  {
    slug: "pharmacy",
    label: "Pharmacy",
    icon: "/icons/categories/pharmacy.svg",
  },
  {
    slug: "decor",
    label: "Decor",
    icon: "/icons/categories/decor.svg",
  },
  {
    slug: "kids",
    label: "Kids",
    icon: "/icons/categories/kids.svg",
  },
  {
    slug: "gifting",
    label: "Gifting",
    icon: "/icons/categories/gifting.svg",
  },
];

const WORKSPACE_TABS = [
  {
    id: "categories",
    label: "Categories",
    icon: FolderTree,
  },
  {
    id: "brands",
    label: "Brands",
    icon: Building2,
  },
  {
    id: "banners",
    label: "Banners",
    icon: ImageIcon,
  },
  {
    id: "preview",
    label: "Preview",
    icon: Smartphone,
  },
] as const;

function flattenTree(
  nodes: CategoryTreeNode[],
  depth = 1,
): FlatCategory[] {
  return nodes.flatMap((node) => {
    const resolvedId = node.id || node._id;

    if (!resolvedId) return [];

    return [
      {
        ...node,
        resolvedId,
        depth,
      },
      ...flattenTree(node.children ?? [], depth + 1),
    ];
  });
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

export default function AdminHeaderCategoriesPage() {
  const { session, hydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [selectedHub, setSelectedHub] =
    useState<CollectionHub>("beauty");

  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>("categories");

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState("");

  const [savedCategoryIds, setSavedCategoryIds] =
    useState<string[]>([]);

  const [draftCategoryIds, setDraftCategoryIds] =
    useState<string[]>([]);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "/api"
  ).replace(/\/$/, "");

  const loadCategories = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${apiBase}/admin/categories/tree`,
        {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: {
          tree?: CategoryTreeNode[];
        };
        tree?: CategoryTreeNode[];
      };

      const nextTree =
        payload.data?.tree ?? payload.tree;

      if (
        !response.ok ||
        !payload.success ||
        !Array.isArray(nextTree)
      ) {
        throw new Error(
          payload.message || "Unable to load categories.",
        );
      }

      setTree(nextTree);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load categories.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiBase]);

  useEffect(() => {
    if (hydrated && accessToken) {
      void loadCategories();
    }
  }, [accessToken, hydrated, loadCategories]);

  const categories = useMemo(
    () => flattenTree(tree),
    [tree],
  );

  useEffect(() => {
    const selectedIds = categories
      .filter(
        (category) =>
          category.collectionHub === selectedHub,
      )
      .sort(
        (first, second) =>
          (first.sortOrder ?? 0) -
          (second.sortOrder ?? 0),
      )
      .map((category) => category.resolvedId);

    setSavedCategoryIds(selectedIds);
    setDraftCategoryIds(selectedIds);
  }, [categories, selectedHub]);

  useEffect(() => {
    setQuery("");
    setError("");
    setMessage("");
    setDraggedId("");
  }, [selectedHub]);

  const selectedCategorySet = useMemo(
    () => new Set(draftCategoryIds),
    [draftCategoryIds],
  );

  const categoriesById = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.resolvedId,
          category,
        ]),
      ),
    [categories],
  );

  const selectedCategories = useMemo(
    () =>
      draftCategoryIds
        .map((categoryId) =>
          categoriesById.get(categoryId),
        )
        .filter(
          (category): category is FlatCategory =>
            Boolean(category),
        ),
    [categoriesById, draftCategoryIds],
  );

  const availableCategories = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    return categories.filter((category) => {
      if (selectedCategorySet.has(category.resolvedId)) {
        return false;
      }

      if (!normalizedQuery) return true;

      return (
        category.name
          .toLowerCase()
          .includes(normalizedQuery) ||
        category.slug
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [categories, query, selectedCategorySet]);

  const collectionCounts = useMemo(() => {
    return Object.fromEntries(
      COLLECTIONS.map((collection) => [
        collection.slug,
        categories.filter(
          (category) =>
            category.collectionHub === collection.slug,
        ).length,
      ]),
    ) as Record<CollectionHub, number>;
  }, [categories]);

  const hasCategoryChanges = !arraysMatch(
    savedCategoryIds,
    draftCategoryIds,
  );

  const addCategory = (categoryId: string) => {
    setDraftCategoryIds((current) =>
      current.includes(categoryId)
        ? current
        : [...current, categoryId],
    );

    setError("");
    setMessage("");
  };

  const removeCategory = (categoryId: string) => {
    setDraftCategoryIds((current) =>
      current.filter((id) => id !== categoryId),
    );

    setError("");
    setMessage("");
  };

  const dropIntoSelected = (
    targetCategoryId?: string,
  ) => {
    if (!draggedId) return;

    setDraftCategoryIds((current) => {
      const next = current.filter(
        (categoryId) => categoryId !== draggedId,
      );

      const targetIndex = targetCategoryId
        ? next.indexOf(targetCategoryId)
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

    removeCategory(draggedId);
    setDraggedId("");
  };

  const discardChanges = () => {
    setDraftCategoryIds(savedCategoryIds);
    setError("");
    setMessage("Unsaved changes discarded.");
  };

  const changeHub = (nextHub: CollectionHub) => {
    if (
      hasCategoryChanges &&
      !window.confirm(
        "Discard unsaved category changes?",
      )
    ) {
      return;
    }

    setSelectedHub(nextHub);
  };

  const saveCategoryChanges = async () => {
    if (
      !accessToken ||
      !hasCategoryChanges ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const desiredOrder = new Map(
      draftCategoryIds.map((categoryId, index) => [
        categoryId,
        index + 1,
      ]),
    );

    const updates: Array<{
      categoryId: string;
      body: Record<string, unknown>;
    }> = [];

    categories.forEach((category) => {
      const nextOrder = desiredOrder.get(
        category.resolvedId,
      );

      if (nextOrder !== undefined) {
        if (
          category.collectionHub !== selectedHub ||
          (category.sortOrder ?? 0) !== nextOrder
        ) {
          updates.push({
            categoryId: category.resolvedId,
            body: {
              collectionHub: selectedHub,
              sortOrder: nextOrder,
            },
          });
        }

        return;
      }

      if (category.collectionHub === selectedHub) {
        updates.push({
          categoryId: category.resolvedId,
          body: {
            collectionHub: null,
          },
        });
      }
    });

    try {
      for (const update of updates) {
        const response = await fetch(
          `${apiBase}/admin/categories/${update.categoryId}`,
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
              "Unable to save category changes.",
          );
        }
      }

      await loadCategories();

      setMessage(
        `${updates.length} category changes saved for ${selectedHub}.`,
      );
    } catch (requestError) {
      await loadCategories();

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save category changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />

      <Container className="py-8">
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">
              Customer navigation
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Header Categories
            </h1>

            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Manage what appears inside each customer
              header collection.
            </p>
          </div>
<HeaderNavigationManager />

          <div className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-[var(--border)] bg-white p-2">
            {COLLECTIONS.map((collection) => {
              const selected =
                selectedHub === collection.slug;

              return (
                <button
                  key={collection.slug}
                  type="button"
                  onClick={() =>
                    changeHub(collection.slug)
                  }
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition ${
                    selected
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
                  }`}
                >
                  <img
                    src={collection.icon}
                    alt=""
                    className={`h-6 w-6 object-contain ${
                      selected
                        ? "brightness-0 invert"
                        : ""
                    }`}
                  />

                  <span>{collection.label}</span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] ${
                      selected
                        ? "bg-white/20"
                        : "bg-[var(--surface-soft)]"
                    }`}
                  >
                    {collectionCounts[collection.slug]}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              disabled
              title="Custom collections will be enabled in the next backend phase."
              className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-xs font-black text-[var(--text-muted)] opacity-60"
            >
              <Plus size={15} />
              Add
            </button>
          </div>

          <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-white">
            <div className="flex overflow-x-auto border-b border-[var(--border)] px-3 pt-3">
              {WORKSPACE_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setActiveTab(tab.id)
                    }
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-xs font-black transition ${
                      active
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-[var(--text-muted)]"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {message ? (
              <p className="mx-5 mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="mx-5 mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]">
                {error}
              </p>
            ) : null}

            {activeTab === "categories" ? (
              <div className="p-5">
                {loading ? (
                  <div className="flex min-h-[420px] items-center justify-center">
                    <Loader2
                      size={24}
                      className="animate-spin text-[var(--primary)]"
                    />
                  </div>
                ) : (
                  <>
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
                            Available Categories
                          </h2>

                          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            Click + or drag an item to the
                            selected pane.
                          </p>

                          <label className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3">
                            <Search
                              size={16}
                              className="text-[var(--text-muted)]"
                            />

                            <input
                              value={query}
                              onChange={(event) =>
                                setQuery(
                                  event.target.value,
                                )
                              }
                              placeholder="Search categories"
                              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                            />
                          </label>
                        </div>

                        <div className="max-h-[520px] space-y-2 overflow-y-auto p-3">
                          {availableCategories.map(
                            (category) => (
                              <article
                                key={category.resolvedId}
                                draggable={!saving}
                                onDragStart={() =>
                                  setDraggedId(
                                    category.resolvedId,
                                  )
                                }
                                onDragEnd={() =>
                                  setDraggedId("")
                                }
                                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3"
                              >
                                <GripVertical
                                  size={17}
                                  className="shrink-0 cursor-grab text-[var(--text-muted)]"
                                />

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-black">
                                    {category.name}
                                  </span>

                                  <span className="mt-1 block text-[9px] text-[var(--text-muted)]">
                                    Level {category.depth} ·{" "}
                                    {category.slug}
                                    {!category.active
                                      ? " · Inactive"
                                      : ""}
                                  </span>

                                  {category.collectionHub &&
                                  category.collectionHub !==
                                    selectedHub ? (
                                    <span className="mt-1 block text-[9px] font-bold text-amber-600">
                                      Currently in{" "}
                                      {
                                        category.collectionHub
                                      }
                                    </span>
                                  ) : null}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    addCategory(
                                      category.resolvedId,
                                    )
                                  }
                                  aria-label={`Add ${category.name}`}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]"
                                >
                                  <Plus size={16} />
                                </button>
                              </article>
                            ),
                          )}

                          {!availableCategories.length ? (
                            <p className="py-12 text-center text-xs font-semibold text-[var(--text-muted)]">
                              No available categories found.
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
                            Selected for {selectedHub}
                          </h2>

                          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            Drag cards to change customer
                            display order.
                          </p>
                        </div>

                        <div className="max-h-[520px] min-h-[220px] space-y-2 overflow-y-auto p-3">
                          {selectedCategories.map(
                            (category, index) => (
                              <article
                                key={category.resolvedId}
                                draggable={!saving}
                                onDragStart={() =>
                                  setDraggedId(
                                    category.resolvedId,
                                  )
                                }
                                onDragEnd={() =>
                                  setDraggedId("")
                                }
                                onDragOver={(event) =>
                                  event.preventDefault()
                                }
                                onDrop={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();

                                  dropIntoSelected(
                                    category.resolvedId,
                                  );
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

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-black">
                                    {category.name}
                                  </span>

                                  <span className="mt-1 block text-[9px] text-[var(--text-muted)]">
                                    Level {category.depth} ·{" "}
                                    {category.slug}
                                  </span>
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeCategory(
                                      category.resolvedId,
                                    )
                                  }
                                  aria-label={`Remove ${category.name}`}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--danger)]"
                                >
                                  <X size={15} />
                                </button>
                              </article>
                            ),
                          )}

                          {!selectedCategories.length ? (
                            <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-center">
                              <FolderTree
                                size={26}
                                className="text-[var(--text-muted)]"
                              />

                              <p className="mt-3 text-xs font-black">
                                No selected categories
                              </p>

                              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                Add or drag categories from
                                the left pane.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </section>
                    </div>

                    <div className="mt-5 flex justify-end gap-3 border-t border-[var(--border)] pt-5">
                      <button
                        type="button"
                        disabled={
                          !hasCategoryChanges || saving
                        }
                        onClick={discardChanges}
                        className="h-11 rounded-xl border border-[var(--border)] px-5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Discard
                      </button>

                      <button
                        type="button"
                        disabled={
                          !hasCategoryChanges || saving
                        }
                        onClick={() =>
                          void saveCategoryChanges()
                        }
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : null}

                        {saving
                          ? "Saving..."
                          : "Save Changes"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {activeTab === "brands" ? (
              <div className="px-5 pb-5">
                <HeaderHubBrandsManager
                  hub={selectedHub}
                  apiBase={apiBase}
                  accessToken={accessToken}
                />
              </div>
            ) : null}

            {activeTab === "banners" ? (
              <div className="px-5 pb-5">
                <HeaderHubBannersManager
                  hub={selectedHub}
                  apiBase={apiBase}
                  accessToken={accessToken}
                />
              </div>
            ) : null}

            {activeTab === "preview" ? (
              <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_390px]">
                <HeaderHubProductsPreview
                  hub={selectedHub}
                />

                <section>
                  <h2 className="text-sm font-black">
                    Customer Mobile Preview
                  </h2>

                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    Live preview of the existing customer
                    design.
                  </p>

                  <div className="mt-4 overflow-hidden rounded-[28px] border-[8px] border-slate-900 bg-white shadow-xl">
                    <iframe
                      key={selectedHub}
                      title={`${selectedHub} customer preview`}
                      src={`/category/${selectedHub}`}
                      className="h-[720px] w-full bg-white"
                    />
                  </div>
                </section>
                
              </div>
            ) : null}
          </section>
          <HeaderHubBrandManager selectedHub={selectedHub} />
        </div>
      </Container>
    </>
  );
}