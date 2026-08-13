"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type BannerItem = {
  _id: string;
  title: string;
  subtitle?: string;
  desktopImage: string;
  mobileImage?: string;
  buttonText?: string;
  buttonLink?: string;
  displayOrder: number;
  showOnHome: boolean;
  active: boolean;
  createdAt: string;
};

export default function AdminMarketingBannersPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/banners`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
      }
    } catch (err) {
      console.error("Failed to load banners", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchBanners();
  }, [accountHydrated, accessToken, fetchBanners]);

  const handleArchiveBanner = async (bannerId: string) => {
    if (!confirm("Are you sure you want to archive this banner?")) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/banners/${bannerId}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to archive banner.");
      void fetchBanners();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-6xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/marketing"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                  <ImageIcon size={22} className="text-blue-600" />
                  Hero Banners Library
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Manage promotional hero carousels and click-through link targets
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchBanners()}
                className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              <Link
                href="/admin/marketing/banners/new"
                className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                Add Banner
              </Link>
            </div>
          </div>

          {/* Banners List */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 font-medium">
              {banners.map((b) => (
                <div key={b._id} className="p-4 hover:bg-slate-50/60 transition flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-28 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      <img
                        src={b.desktopImage || b.mobileImage}
                        alt={b.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black text-slate-900">{b.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            b.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {b.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {b.subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{b.subtitle}</p>}
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                        <span>Target: {b.buttonLink || "/products"}</span>
                        <span>Order: #{b.displayOrder}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/marketing/banners/${b._id}`}
                      className="h-8 px-3 rounded-lg border border-[var(--border)] text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Pencil size={13} />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleArchiveBanner(b._id)}
                      className="h-8 px-3 rounded-lg border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      Archive
                    </button>
                  </div>
                </div>
              ))}

              {banners.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  No hero banners found in library. Click "Add Banner" to create one.
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
