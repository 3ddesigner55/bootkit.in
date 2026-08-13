"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Image as ImageIcon,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import {
  ImageUploader,
  type ImageUploaderItem,
} from "@/components/admin/media";
import { useAccount } from "@/hooks/useAccount";
import { uploadAdminHeroBannerImages } from "@/services/adminHeroBanners.service";

function toUploaderItem(
  url: string,
  id: string,
  name: string,
): ImageUploaderItem[] {
  if (!url) return [];

  return [{ id, url, name, progress: 100, status: "uploaded" }];
}

export default function AdminEditBannerPage({
  params,
}: {
  params: Promise<{ bannerId: string }>;
}) {
  const { bannerId } = use(params);
  const router = useRouter();
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    desktopImage: "",
    mobileImage: "",
    buttonText: "Shop Now",
    buttonLink: "/products",
    displayOrder: 1,
    showOnHome: true,
    active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [desktopImageItems, setDesktopImageItems] = useState<ImageUploaderItem[]>([]);
  const [mobileImageItems, setMobileImageItems] = useState<ImageUploaderItem[]>([]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;

    const fetchBanner = async () => {
      try {
        setLoading(true);
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/admin/marketing/banners/${bannerId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.success && data.banner) {
          const b = data.banner;
          setForm({
            title: b.title || "",
            subtitle: b.subtitle || "",
            desktopImage: b.desktopImage || "",
            mobileImage: b.mobileImage || "",
            buttonText: b.buttonText || "Shop Now",
            buttonLink: b.buttonLink || "/products",
            displayOrder: b.displayOrder || 1,
            showOnHome: b.showOnHome !== false,
            active: b.active !== false,
          });
          setDesktopImageItems(
            toUploaderItem(b.desktopImage || "", "desktop-image", "Desktop banner image"),
          );
          setMobileImageItems(
            toUploaderItem(b.mobileImage || "", "mobile-image", "Mobile banner image"),
          );
        }
      } catch (err) {
        console.error("Failed to load banner", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchBanner();
  }, [accountHydrated, accessToken, bannerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "displayOrder") {
      setForm((prev) => ({ ...prev, [name]: parseInt(value, 10) || 1 }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!accessToken) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const desktopImageFile = desktopImageItems.find((item) => item.file)?.file;
      const mobileImageFile = mobileImageItems.find((item) => item.file)?.file;
      const uploadedImages =
        desktopImageFile || mobileImageFile
          ? await uploadAdminHeroBannerImages(accessToken, {
              desktopImage: desktopImageFile,
              mobileImage: mobileImageFile,
            })
          : {};
      const desktopImage = desktopImageFile
        ? uploadedImages.desktopImage || ""
        : desktopImageItems[0]?.url || form.desktopImage;
      const mobileImage = mobileImageFile
        ? uploadedImages.mobileImage || ""
        : mobileImageItems[0]?.url || form.mobileImage;

      if (!desktopImage) {
        throw new Error("A desktop banner image is required.");
      }

      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/banners/${bannerId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, desktopImage, mobileImage }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update banner.");
      }

      setSuccess("Banner updated successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update banner.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-slate-500 text-sm">
          Loading banner details...
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/admin/marketing/banners"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)]">Edit Banner: {form.title}</h1>
              <p className="text-xs text-[var(--text-muted)]">Update promotional banner details and image assets</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl mb-6 font-medium flex items-center gap-2 border border-red-200">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-700 text-xs p-4 rounded-2xl mb-6 font-medium flex items-center gap-2 border border-emerald-200">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <ImageIcon size={16} className="text-[var(--primary)]" />
                Banner Content & Creative
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Banner Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={form.title}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={form.subtitle}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Desktop Image URL *</label>
                  <input
                    type="url"
                    name="desktopImage"
                    required
                    value={form.desktopImage}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                  />
                  <ImageUploader
                    className="mt-3"
                    label="Or drag desktop image"
                    value={desktopImageItems}
                    onChange={setDesktopImageItems}
                    helperText="Drop an image here to upload it securely."
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Image URL (Optional)</label>
                  <input
                    type="url"
                    name="mobileImage"
                    value={form.mobileImage}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                  />
                  <ImageUploader
                    className="mt-3"
                    label="Or drag mobile image"
                    value={mobileImageItems}
                    onChange={setMobileImageItems}
                    helperText="Optional mobile-specific creative."
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Button Text</label>
                  <input
                    type="text"
                    name="buttonText"
                    value={form.buttonText}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Click-Through Link Target *</label>
                  <input
                    type="text"
                    name="buttonLink"
                    required
                    value={form.buttonLink}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    min="1"
                    value={form.displayOrder}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showOnHome"
                      checked={form.showOnHome}
                      onChange={handleChange}
                      className="rounded accent-[var(--primary)]"
                    />
                    Show in Carousel
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      name="active"
                      checked={form.active}
                      onChange={handleChange}
                      className="rounded accent-[var(--primary)]"
                    />
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/admin/marketing/banners"
                className="h-11 px-5 rounded-xl border border-[var(--border)] text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-xl bg-[var(--primary)] text-xs font-bold text-white hover:brightness-95 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={15} />
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}
