"use client";

import {
  CheckCircle2,
  FileImage,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
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
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";

type HeroBanner = {
  id: string;
  image: string;
  mobileImage: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  displayOrder: number;
  active: boolean;
};

type HeroBannerForm = Omit<
  HeroBanner,
  "id" | "displayOrder"
> & {
  displayOrder: string;
};

const emptyForm: HeroBannerForm = {
  image: "",
  mobileImage: "",
  title: "",
  subtitle: "",
  buttonText: "Shop now",
  buttonLink: "/products",
  displayOrder: "0",
  active: true,
};

function toUploaderValue(
  url: string,
  id: string,
  name: string
): ImageUploaderItem[] {
  if (!url) return [];

  return [
    {
      id,
      url,
      name,
      progress: url.startsWith("blob:") ? 0 : 100,
      status: url.startsWith("blob:") ? "ready" : "uploaded",
    },
  ];
}

export default function AdminHeroBannersClient() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] =
    useState<HeroBanner | null>(null);
  const [form, setForm] = useState<HeroBannerForm>(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading] = useState(false);

  const openAddForm = () => {
    setEditingBanner(null);
    setForm({
      ...emptyForm,
      displayOrder: String(banners.length),
    });
    setError("");
    setMessage("");
    setFormOpen(true);
  };

  const openEditForm = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setForm({
      image: banner.image,
      mobileImage: banner.mobileImage,
      title: banner.title,
      subtitle: banner.subtitle,
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink,
      displayOrder: String(banner.displayOrder),
      active: banner.active,
    });
    setError("");
    setMessage("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingBanner(null);
    setForm(emptyForm);
    setError("");
  };

  const saveBanner = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Please enter a banner title.");
      return;
    }

    const displayOrder = Number(form.displayOrder);

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setError("Display order must be a valid whole number.");
      return;
    }

    const nextBanner: HeroBanner = {
      id:
        editingBanner?.id ??
        `hero_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      image: form.image,
      mobileImage: form.mobileImage,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      buttonText: form.buttonText.trim(),
      buttonLink: form.buttonLink.trim(),
      displayOrder,
      active: form.active,
    };

    setBanners((current) =>
      editingBanner
        ? current.map((banner) =>
            banner.id === editingBanner.id
              ? nextBanner
              : banner
          )
        : [...current, nextBanner]
    );

    setMessage(
      `${nextBanner.title} ${
        editingBanner ? "updated" : "added"
      } in this preview session.`
    );
    closeForm();
  };

  const deleteBanner = (banner: HeroBanner) => {
    setBanners((current) =>
      current.filter((item) => item.id !== banner.id)
    );
    setMessage(`${banner.title} removed from this preview session.`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <AdminPageHeader
            title="Hero banners"
            description="Create and organize storefront banners"
            action={
              <AdminPrimaryButton icon={<Plus size={15} />} onClick={openAddForm}>
                Add banner
              </AdminPrimaryButton>
            }
          />

          {message && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
              <CheckCircle2 size={16} />
              {message}
            </div>
          )}

          {formOpen && (
            <section className="mb-5 rounded-[26px] border border-[var(--primary)] bg-white p-4 shadow-[var(--shadow-md)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--primary)]">
                    {editingBanner ? "Editing banner" : "New banner"}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[var(--text-primary)]">
                    {editingBanner ? editingBanner.title : "Add hero banner"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close banner form"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-muted)]"
                >
                  <X size={17} />
                </button>
              </div>

              <form onSubmit={saveBanner} className="mt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ImageUploader
                    label="Banner Image"
                    value={toUploaderValue(
                      form.image,
                      "hero-banner-image",
                      "Hero banner image"
                    )}
                    onChange={(items) =>
                      setForm((current) => ({
                        ...current,
                        image: items[0]?.url ?? "",
                      }))
                    }
                  />

                  <ImageUploader
                    label="Mobile Banner Image"
                    value={toUploaderValue(
                      form.mobileImage,
                      "hero-banner-mobile-image",
                      "Mobile hero banner image"
                    )}
                    onChange={(items) =>
                      setForm((current) => ({
                        ...current,
                        mobileImage: items[0]?.url ?? "",
                      }))
                    }
                  />

                  <BannerField
                    label="Title"
                    value={form.title}
                    placeholder="Fresh groceries, delivered beautifully."
                    required
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        title: value,
                      }))
                    }
                  />

                  <BannerField
                    label="Subtitle"
                    value={form.subtitle}
                    placeholder="Premium groceries delivered in minutes."
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        subtitle: value,
                      }))
                    }
                  />

                  <BannerField
                    label="Button Text"
                    value={form.buttonText}
                    placeholder="Shop now"
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        buttonText: value,
                      }))
                    }
                  />

                  <BannerField
                    label="Button Link"
                    value={form.buttonLink}
                    placeholder="/products"
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        buttonLink: value,
                      }))
                    }
                  />

                  <BannerField
                    label="Display Order"
                    value={form.displayOrder}
                    placeholder="0"
                    inputMode="numeric"
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        displayOrder: value.replace(/\D/g, ""),
                      }))
                    }
                  />

                  <label className="flex items-end">
                    <span className="flex h-12 w-full items-center justify-between rounded-xl bg-[var(--surface-soft)] px-4">
                      <span>
                        <span className="block text-xs font-black text-[var(--text-primary)]">
                          Active banner
                        </span>
                        <span className="text-[9px] text-[var(--text-muted)]">
                          Available for future storefront display
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            active: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                    </span>
                  </label>
                </div>

                {error && (
                  <p role="alert" className="mt-4 text-xs font-bold text-[var(--danger)]">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <AdminPrimaryButton
                    type="submit"
                    icon={<Save size={17} />}
                    className="h-12 flex-1 rounded-2xl text-sm"
                  >
                    {editingBanner ? "Update banner" : "Save banner"}
                  </AdminPrimaryButton>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] text-sm font-black text-[var(--text-secondary)]"
                  >
                    <X size={17} />
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {isLoading ? (
            <AdminLoadingSkeleton count={3} className="[&>div]:h-80 md:grid-cols-2" />
          ) : banners.length === 0 ? (
            <AdminEmptyState
              title="No hero banners yet"
              description="Add a banner to prepare the future storefront banner collection."
              icon={FileImage}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {banners
                .slice()
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((banner) => (
                  <BannerCard
                    key={banner.id}
                    banner={banner}
                    onEdit={() => openEditForm(banner)}
                    onDelete={() => deleteBanner(banner)}
                  />
                ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

function BannerField({
  label,
  value,
  placeholder,
  required = false,
  inputMode = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  inputMode?: "text" | "numeric";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
        {label}
        {required && (
          <span className="ml-1 text-[var(--danger)]">*</span>
        )}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
      />
    </label>
  );
}

function BannerCard({
  banner,
  onEdit,
  onDelete,
}: {
  banner: HeroBanner;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      <div
        role="img"
        aria-label={banner.title}
        className="h-44 bg-[var(--surface-soft)] bg-cover bg-center"
        style={
          banner.image
            ? { backgroundImage: `url("${banner.image}")` }
            : undefined
        }
      >
        {!banner.image && (
          <span className="flex h-full items-center justify-center text-[var(--text-muted)]">
            <FileImage size={30} />
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[var(--text-primary)]">
              {banner.title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
              {banner.subtitle || "No subtitle"}
            </p>
          </div>
          <AdminStatusBadge
            label={banner.active ? "Active" : "Inactive"}
            tone={banner.active ? "success" : "neutral"}
            className="text-[9px]"
          />
        </div>

        <p className="mt-3 text-[10px] text-[var(--text-muted)]">
          Order {banner.displayOrder} · {banner.buttonText || "No button"}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] text-[10px] font-black text-[var(--text-secondary)]"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-50 text-[10px] font-black text-[var(--danger)]"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
