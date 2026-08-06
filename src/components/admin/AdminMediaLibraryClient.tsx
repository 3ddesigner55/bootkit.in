"use client";

import {
  CheckSquare,
  FileImage,
  ImagePlus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import {
  ImageUploader,
  type ImageUploaderItem,
} from "@/components/admin/media";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminLoadingSkeleton from "@/components/admin/ui/AdminLoadingSkeleton";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminPrimaryButton from "@/components/admin/ui/AdminPrimaryButton";
import AdminSearchBar from "@/components/admin/ui/AdminSearchBar";

type MediaType =
  | "Categories"
  | "Products"
  | "Hero"
  | "Brands"
  | "Stores";

type MediaItem = {
  id: string;
  url: string;
  name: string;
  type: MediaType;
  size: string;
  uploadedAt: string;
};

type MediaFilter = "All" | MediaType;

const mediaFilters: MediaFilter[] = [
  "All",
  "Categories",
  "Products",
  "Hero",
  "Brands",
  "Stores",
];

const mediaItems: MediaItem[] = [];

export default function AdminMediaLibraryClient() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MediaFilter>("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingUploads, setPendingUploads] = useState<
    ImageUploaderItem[]
  >([]);
  const [isLoading] = useState(false);

  const filteredMedia = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mediaItems.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        filter === "All" || item.type === filter;

      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  const toggleSelection = (mediaId: string) => {
    setSelectedIds((current) =>
      current.includes(mediaId)
        ? current.filter((id) => id !== mediaId)
        : [...current, mediaId]
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <AdminPageHeader
            title="Media library"
            description="Manage store images in one place"
            action={
              <AdminPrimaryButton
                icon={<Upload size={15} />}
                onClick={() => setUploadOpen((current) => !current)}
              >
                Upload media
              </AdminPrimaryButton>
            }
          />

          {uploadOpen && (
            <section className="mb-5 rounded-[24px] border border-[var(--primary)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--text-primary)]">
                    Select media
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Upload processing will be connected to the approved backend.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  aria-label="Close media upload panel"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)]"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              <ImageUploader
                label="Media files"
                multiple
                value={pendingUploads}
                onChange={setPendingUploads}
                helperText="Files are selected locally only. No upload is performed in this UI sprint."
              />
            </section>
          )}

          <section className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <AdminSearchBar
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search media files"
              />

              <div className="flex flex-wrap gap-2">
                {mediaFilters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`h-9 rounded-lg px-3 text-[10px] font-black transition ${
                      filter === item
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {isLoading ? (
            <AdminLoadingSkeleton
              count={8}
              className="mt-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            />
          ) : filteredMedia.length === 0 ? (
            <AdminEmptyState
              title="No media files yet"
              description="Selected images will appear here after the approved backend upload flow is connected."
              icon={ImagePlus}
              className="mt-5"
            />
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMedia.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.includes(item.id)}
                  onToggleSelection={() => toggleSelection(item.id)}
                />
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

function MediaCard({
  item,
  selected,
  onToggleSelection,
}: {
  item: MediaItem;
  selected: boolean;
  onToggleSelection: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      <div
        role="img"
        aria-label={item.name}
        className="h-44 bg-[var(--surface-soft)] bg-cover bg-center"
        style={{ backgroundImage: `url("${item.url}")` }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[var(--text-primary)]">
              {item.name}
            </p>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              {item.type} · {item.size}
            </p>
          </div>

          <label className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--primary)]">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelection}
              aria-label={`Select ${item.name}`}
              className="sr-only"
            />
            <CheckSquare size={15} />
          </label>
        </div>

        <p className="mt-3 text-[10px] text-[var(--text-muted)]">
          Uploaded {item.uploadedAt}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] text-[10px] font-black text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileImage size={14} />
            Replace
          </button>
          <button
            type="button"
            disabled
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-50 text-[10px] font-black text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
