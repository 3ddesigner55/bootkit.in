"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  User,
  Shield,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type StoreItem = {
  _id: string;
  name: string;
  slug: string;
};

export default function AdminOnboardRiderPage() {
  const router = useRouter();
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    assignedStore: "",
    vehicleType: "Petrol Bike",
    vehicleRegNumber: "",
    vehicleModel: "",
    vehicleColor: "Black",
    licenseNumber: "",
    licenseHolderName: "",
    licenseExpiryDate: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;

    const fetchStores = async () => {
      try {
        setLoadingStores(true);
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/admin/stores`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.stores)) {
          setStores(data.stores);
          if (data.stores.length > 0) {
            setForm((prev) => ({ ...prev, assignedStore: data.stores[0]._id }));
          }
        }
      } catch (err) {
        console.error("Failed to load stores", err);
      } finally {
        setLoadingStores(false);
      }
    };

    void fetchStores();
  }, [accountHydrated, accessToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/riders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to onboard rider.");
      }

      setSuccess("Rider onboarded successfully with pending verification.");
      setTimeout(() => {
        router.push("/admin/riders");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to onboard rider.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/admin/riders"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)]">Onboard New Delivery Rider</h1>
              <p className="text-xs text-[var(--text-muted)]">Register a rider, vehicle details, license, and Hub assignment</p>
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
            {/* Section 1: Personal & Hub */}
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <User size={16} className="text-[var(--primary)]" />
                Personal Details & Hub Assignment
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="e.g. Ramesh"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="e.g. Kumar"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. ramesh@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned Fulfillment Hub *</label>
                  <select
                    name="assignedStore"
                    required
                    value={form.assignedStore}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                  >
                    {stores.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Vehicle Information */}
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Truck size={16} className="text-[var(--primary)]" />
                Vehicle Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Type *</label>
                  <select
                    name="vehicleType"
                    required
                    value={form.vehicleType}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                  >
                    <option value="Petrol Bike">Petrol Bike</option>
                    <option value="Electric Bike">Electric Bike</option>
                    <option value="Scooty">Scooty</option>
                    <option value="Cycle">Cycle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Registration Number *</label>
                  <input
                    type="text"
                    name="vehicleRegNumber"
                    required
                    placeholder="e.g. MH01AB1234"
                    value={form.vehicleRegNumber}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono uppercase outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Model</label>
                  <input
                    type="text"
                    name="vehicleModel"
                    placeholder="e.g. Hero Splendor Plus"
                    value={form.vehicleModel}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Color</label>
                  <input
                    type="text"
                    name="vehicleColor"
                    value={form.vehicleColor}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Driving License & KYC */}
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Shield size={16} className="text-[var(--primary)]" />
                Driving License & KYC
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Driving License Number *</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    required
                    placeholder="e.g. MH0120180012345"
                    value={form.licenseNumber}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono uppercase outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">License Expiry Date</label>
                  <input
                    type="date"
                    name="licenseExpiryDate"
                    value={form.licenseExpiryDate}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/admin/riders"
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
                {saving ? "Onboarding Rider..." : "Onboard Rider"}
              </button>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}
