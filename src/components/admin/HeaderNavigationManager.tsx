"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  X,
} from "lucide-react";

import { useAccount } from "@/hooks/useAccount";
import {
  getAdminHeaderNavigation,
  saveAdminHeaderNavigation,
  type HeaderNavigationItem,
} from "@/services/headerNavigation.service";

export default function HeaderNavigationManager() {
  const { session, hydrated } = useAccount();

  const [items, setItems] = useState<HeaderNavigationItem[]>([]);
  const [savedItems, setSavedItems] = useState<
    HeaderNavigationItem[]
  >([]);

  const [draggedSlug, setDraggedSlug] = useState<string | null>(
    null,
  );
  const [editingSlug, setEditingSlug] = useState<string | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const accessToken = session?.accessToken;

  const loadItems = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError("");

    try {
      const result = await getAdminHeaderNavigation(accessToken);
      setItems(result);
      setSavedItems(result);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load header navigation.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!hydrated) return;

    if (!accessToken) {
      setLoading(false);
      return;
    }

    void loadItems();
  }, [accessToken, hydrated, loadItems]);

  const changed = useMemo(
    () => JSON.stringify(items) !== JSON.stringify(savedItems),
    [items, savedItems],
  );

  const editingItem =
    items.find((item) => item.slug === editingSlug) ?? null;

  const previewItems = useMemo(
    () =>
      [...items]
        .filter((item) => item.active)
        .sort(
          (first, second) =>
            first.sortOrder - second.sortOrder,
        ),
    [items],
  );

  const updateItem = (
    slug: string,
    changes: Partial<HeaderNavigationItem>,
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.slug === slug
          ? { ...item, ...changes }
          : item,
      ),
    );

    setMessage("");
  };

  const moveItem = (
    sourceSlug: string,
    targetSlug: string,
  ) => {
    if (sourceSlug === targetSlug) return;

    setItems((current) => {
      const sourceIndex = current.findIndex(
        (item) => item.slug === sourceSlug,
      );
      const targetIndex = current.findIndex(
        (item) => item.slug === targetSlug,
      );

      if (sourceIndex < 0 || targetIndex < 0) {
        return current;
      }

      const reordered = [...current];
      const [movedItem] = reordered.splice(sourceIndex, 1);

      reordered.splice(targetIndex, 0, movedItem);

      return reordered.map((item, index) => ({
        ...item,
        sortOrder: index + 1,
      }));
    });

    setMessage("");
  };

  const discardChanges = () => {
    setItems(savedItems);
    setEditingSlug(null);
    setError("");
    setMessage("");
  };

  const saveChanges = async () => {
    if (!accessToken || saving || !changed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const saved = await saveAdminHeaderNavigation(
        accessToken,
        items,
      );

      setItems(saved);
      setSavedItems(saved);
      setEditingSlug(null);
      setMessage("Header layout saved successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save header layout.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-white">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-black">
              Header Categories Admin
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Control customer app navigation order and visibility.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={discardChanges}
              disabled={!changed || saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-xs font-black disabled:opacity-40"
            >
              <RotateCcw size={15} />
              Undo
            </button>

            <button
              type="button"
              onClick={saveChanges}
              disabled={!changed || saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-white disabled:opacity-40"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save Layout
            </button>
          </div>
        </header>

        {error ? (
          <p className="mx-5 mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mx-5 mt-4 rounded-xl bg-green-50 px-4 py-3 text-xs font-bold text-[var(--primary)]">
            {message}
          </p>
        ) : null}

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--primary)]">
                1. Reorder & Manage
              </p>

              <h3 className="mt-1 text-base font-black">
                Customer header items
              </h3>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Drag items to change their app order.
              </p>
            </div>

            <button
              type="button"
              disabled
              title="Dynamic category creation will be connected next"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-[var(--primary)] bg-white px-4 text-xs font-black text-[var(--primary)] opacity-60"
            >
              <Plus size={16} />
              Add New Category
            </button>

            {loading ? (
              <div className="flex min-h-72 items-center justify-center">
                <Loader2
                  size={22}
                  className="animate-spin text-[var(--primary)]"
                />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {items.map((item, index) => (
                  <article
                    key={item.slug}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();

                      const sourceSlug =
                        event.dataTransfer.getData(
                          "text/plain",
                        ) || draggedSlug;

                      if (sourceSlug) {
                        moveItem(sourceSlug, item.slug);
                      }

                      setDraggedSlug(null);
                    }}
                    className={`flex items-center gap-3 rounded-xl border bg-white p-3 transition ${
                      draggedSlug === item.slug
                        ? "border-[var(--primary)] opacity-50"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        setDraggedSlug(item.slug);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData(
                          "text/plain",
                          item.slug,
                        );
                      }}
                      onDragEnd={() => setDraggedSlug(null)}
                      aria-label={`Drag ${item.label}`}
                      className="cursor-grab text-[var(--text-muted)] active:cursor-grabbing"
                    >
                      <GripVertical size={19} />
                    </button>

                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)]">
                      <img
                        src={item.icon}
                        alt=""
                        className="h-7 w-7 object-contain"
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black">
                          {index + 1}. {item.label}
                        </p>

                        {!item.active ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black text-red-600">
                            Hidden
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                        /category/{item.slug}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSlug(item.slug)}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-[10px] font-black"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>

          
        </div>
      </section>

      {editingItem ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black">
                  Edit {editingItem.label}
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Route slug remains fixed: {editingItem.slug}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingSlug(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)]"
              >
                <X size={17} />
              </button>
            </div>

            <label className="mt-5 block text-xs font-black">
              Display name
              <input
                value={editingItem.label}
                maxLength={40}
                onChange={(event) =>
                  updateItem(editingItem.slug, {
                    label: event.target.value,
                  })
                }
                className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="mt-4 block text-xs font-black">
              Icon URL or public path
              <input
                value={editingItem.icon}
                maxLength={500}
                onChange={(event) =>
                  updateItem(editingItem.slug, {
                    icon: event.target.value,
                  })
                }
                className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)]"
              />
            </label>

            <button
              type="button"
              onClick={() =>
                updateItem(editingItem.slug, {
                  active: !editingItem.active,
                })
              }
              className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-black ${
                editingItem.active
                  ? "bg-green-50 text-[var(--primary)]"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {editingItem.active ? (
                <>
                  <Eye size={16} />
                  Visible in customer app
                </>
              ) : (
                <>
                  <EyeOff size={16} />
                  Hidden from customer app
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setEditingSlug(null)}
              className="mt-5 h-11 w-full rounded-xl bg-[var(--primary)] text-xs font-black text-white"
            >
              Done
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}