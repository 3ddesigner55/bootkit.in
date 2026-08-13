"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  User,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

export default function AdminEditStorePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const router = useRouter();
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    phone: "",
    email: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    latitude: 19.076,
    longitude: 72.8777,
    managerName: "",
    managerPhone: "",
    deliveryRadius: 5,
    minimumOrderAmount: 0,
    active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;

    const fetchStore = async () => {
      try {
        setLoading(true);
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/admin/stores/${storeId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.success && data.store) {
          const s = data.store;
          setForm({
            name: s.name || "",
            slug: s.slug || "",
            description: s.description || "",
            phone: s.phone || "",
            email: s.email || "",
            addressLine1: s.addressLine1 || "",
            city: s.city || "",
            state: s.state || "",
            country: s.country || "India",
            postalCode: s.postalCode || "",
            latitude: s.latitude || 19.076,
            longitude: s.longitude || 72.8777,
            managerName: s.managerName || "",
            managerPhone: s.managerPhone || "",
            deliveryRadius: s.deliveryRadius || 5,
            minimumOrderAmount: s.minimumOrderAmount || 0,
            active: s.active !== false,
          });
        }
      } catch (err) {
        console.error("Failed to fetch store", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchStore();
  }, [accountHydrated, accessToken, storeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "deliveryRadius" || name === "minimumOrderAmount" || name === "latitude" || name === "longitude") {
      setForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
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
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update store.");
      }
      setSuccess("Store details updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update store.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-slate-500 text-sm">
          Loading store details...
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
              href="/admin/stores"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)]">Edit Hub: {form.name}</h1>
              <p className="text-xs text-[var(--text-muted)]">Update hub contact details, address, and delivery boundaries</p>
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
                <Store size={16} className="text-[var(--primary)]" />
                Basic Hub Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hub Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hub Code / Slug</label>
                  <input
                    type="text"
                    name="slug"
                    disabled
                    value={form.slug}
                    className="w-full h-10 px-3 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <MapPin size={16} className="text-[var(--primary)]" />
                Address & Delivery Radius
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Address *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    required
                    value={form.addressLine1}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={form.city}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">State *</label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={form.state}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Delivery Radius (km) *</label>
                  <input
                    type="number"
                    name="deliveryRadius"
                    min="0.1"
                    step="0.1"
                    required
                    value={form.deliveryRadius}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/admin/stores"
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
                {saving ? "Saving Changes..." : "Save Hub Details"}
              </button>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}
