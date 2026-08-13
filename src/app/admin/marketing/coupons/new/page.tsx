"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ticket,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

export default function AdminNewCouponPage() {
  const router = useRouter();
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [form, setForm] = useState({
    code: "",
    displayName: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "10",
    maxDiscount: "100",
    minOrderValue: "299",
    totalUsageLimit: "500",
    perCustomerLimit: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    firstOrderOnly: false,
    active: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
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
      const res = await fetch(`${baseUrl}/admin/marketing/coupons`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create coupon.");
      }

      setSuccess("Coupon created successfully.");
      setTimeout(() => {
        router.push("/admin/marketing/coupons");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to create coupon.");
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
              href="/admin/marketing/coupons"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)]">Create New Discount Coupon</h1>
              <p className="text-xs text-[var(--text-muted)]">Configure promo code rules, percentage/flat discounts, and redemption limits</p>
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
                <Ticket size={16} className="text-[var(--primary)]" />
                Coupon Identity & Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Coupon Code *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    placeholder="e.g. MEGA50"
                    value={form.code}
                    onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono uppercase font-bold outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Name *</label>
                  <input
                    type="text"
                    name="displayName"
                    required
                    placeholder="e.g. Mega Weekend Savings"
                    value={form.displayName}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer-Facing Description</label>
                  <textarea
                    rows={2}
                    name="description"
                    placeholder="e.g. Get ₹50 flat discount on orders above ₹299"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full p-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                Discount Calculation Rules
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Discount Type *</label>
                  <select
                    name="discountType"
                    required
                    value={form.discountType}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Discount Value *</label>
                  <input
                    type="number"
                    name="discountValue"
                    min="1"
                    step="0.01"
                    required
                    value={form.discountValue}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Maximum Cap (₹)</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    min="0"
                    placeholder="Optional max cap"
                    value={form.maxDiscount}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Minimum Order Subtotal (₹)</label>
                  <input
                    type="number"
                    name="minOrderValue"
                    min="0"
                    value={form.minOrderValue}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Redemptions Limit</label>
                  <input
                    type="number"
                    name="totalUsageLimit"
                    min="1"
                    value={form.totalUsageLimit}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Limit Per Customer</label>
                  <input
                    type="number"
                    name="perCustomerLimit"
                    min="1"
                    value={form.perCustomerLimit}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={form.endDate}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      name="firstOrderOnly"
                      checked={form.firstOrderOnly}
                      onChange={handleChange}
                      className="rounded accent-[var(--primary)]"
                    />
                    First Order Only
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
                href="/admin/marketing/coupons"
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
                {saving ? "Creating Coupon..." : "Create Coupon"}
              </button>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}
