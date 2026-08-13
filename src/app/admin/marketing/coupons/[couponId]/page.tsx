"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ticket,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  ShoppingBag,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type RedemptionItem = {
  _id: string;
  customer?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  order?: {
    orderNumber: string;
    grandTotal: number;
  };
  discountAmount: number;
  status: string;
  createdAt: string;
};

export default function AdminEditCouponPage({
  params,
}: {
  params: Promise<{ couponId: string }>;
}) {
  const { couponId } = use(params);
  const router = useRouter();
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [form, setForm] = useState({
    code: "",
    displayName: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscount: 100,
    minOrderValue: 299,
    totalUsageLimit: 500,
    perCustomerLimit: 1,
    startDate: "",
    endDate: "",
    firstOrderOnly: false,
    active: true,
  });

  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");

      const [cRes, rRes] = await Promise.all([
        fetch(`${baseUrl}/admin/marketing/coupons/${couponId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/marketing/coupons/${couponId}/redemptions`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      const [cData, rData] = await Promise.all([cRes.json(), rRes.json()]);

      if (cData.success && cData.coupon) {
        const c = cData.coupon;
        setForm({
          code: c.code || "",
          displayName: c.displayName || "",
          description: c.description || "",
          discountType: c.discountType || "PERCENTAGE",
          discountValue: c.discountValue || 10,
          maxDiscount: c.maxDiscount || 0,
          minOrderValue: c.minOrderValue || 0,
          totalUsageLimit: c.totalUsageLimit || 0,
          perCustomerLimit: c.perCustomerLimit || 1,
          startDate: c.startDate ? c.startDate.split("T")[0] : "",
          endDate: c.endDate ? c.endDate.split("T")[0] : "",
          firstOrderOnly: Boolean(c.firstOrderOnly),
          active: c.active !== false,
        });
      }

      if (rData.success && Array.isArray(rData.redemptions)) {
        setRedemptions(rData.redemptions);
      }
    } catch (err) {
      console.error("Failed to load coupon", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, couponId]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchData();
  }, [accountHydrated, accessToken, fetchData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "discountValue" || name === "maxDiscount" || name === "minOrderValue" || name === "totalUsageLimit" || name === "perCustomerLimit") {
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
      const res = await fetch(`${baseUrl}/admin/marketing/coupons/${couponId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update coupon.");
      }

      setSuccess("Coupon rules updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update coupon.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-slate-500 text-sm">
          Loading coupon details...
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/admin/marketing/coupons"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)]">Edit Coupon: {form.code}</h1>
              <p className="text-xs text-[var(--text-muted)]">Configure discount parameters and view redemption history</p>
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

          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Ticket size={16} className="text-[var(--primary)]" />
                  Coupon Rules & Limits
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Coupon Code</label>
                    <input
                      type="text"
                      disabled
                      value={form.code}
                      className="w-full h-10 px-3 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl text-xs font-mono uppercase font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Name *</label>
                    <input
                      type="text"
                      name="displayName"
                      required
                      value={form.displayName}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
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
                      value={form.maxDiscount}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Min Order Value (₹)</label>
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
                      value={form.totalUsageLimit}
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
                        name="active"
                        checked={form.active}
                        onChange={handleChange}
                        className="rounded accent-[var(--primary)]"
                      />
                      Active Status
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
                  {saving ? "Saving Changes..." : "Save Coupon Changes"}
                </button>
              </div>
            </form>

            {/* Redemptions History */}
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-black text-sm text-slate-800">
                Redemption History ({redemptions.length})
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Discount Applied</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {redemptions.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : "Customer"}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--primary)]">
                          {r.order ? `#${r.order.orderNumber}` : "Order"}
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-600">
                          {formatPrice(r.discountAmount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {redemptions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No customer redemptions recorded for this coupon yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
