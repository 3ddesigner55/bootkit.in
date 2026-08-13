"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Ticket,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Percent,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type CouponItem = {
  _id: string;
  code: string;
  displayName: string;
  description?: string;
  discountType: "FLAT" | "PERCENTAGE" | "FREE_DELIVERY" | "WALLET_CASHBACK";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  redemptionsCount: number;
  totalUsageLimit?: number;
  perCustomerLimit: number;
  firstOrderOnly: boolean;
  active: boolean;
  createdAt: string;
};

export default function AdminMarketingCouponsPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Test Calculator Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState("");
  const [previewSubtotal, setPreviewSubtotal] = useState("500");
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchCoupons = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/coupons`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error("Failed to load coupons", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchCoupons();
  }, [accountHydrated, accessToken, fetchCoupons]);

  const handleTestPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreviewLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/coupons/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: previewCode,
          cartTotal: parseFloat(previewSubtotal) || 500,
        }),
      });
      const data = await res.json();
      setPreviewResult(data);
    } catch (err) {
      console.error("Preview failed", err);
    } finally {
      setPreviewLoading(false);
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
                  <Ticket size={22} className="text-emerald-600" />
                  Coupons & Promo Codes
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Discount rule builder, customer redemption limits, and zero-write preview evaluator
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
              >
                <Percent size={15} className="text-purple-600" />
                Test Discount Rule
              </button>

              <Link
                href="/admin/marketing/coupons/new"
                className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                Create Coupon
              </Link>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Coupon Code</th>
                    <th className="py-3.5 px-4">Discount</th>
                    <th className="py-3.5 px-4">Min Order</th>
                    <th className="py-3.5 px-4">Redemptions</th>
                    <th className="py-3.5 px-4">Validity</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {coupons.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                          {c.code}
                        </span>
                        {c.firstOrderOnly && (
                          <span className="text-[9px] font-bold text-blue-600 block mt-1">1st Order Only</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900">
                        {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : formatPrice(c.discountValue)}
                        {c.maxDiscount && (
                          <span className="text-[10px] text-slate-400 font-normal block">
                            (Max: {formatPrice(c.maxDiscount)})
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-bold">
                        {formatPrice(c.minOrderValue || 0)}
                      </td>

                      <td className="py-4 px-4 text-slate-800">
                        <strong>{c.redemptionsCount || 0}</strong>
                        {c.totalUsageLimit ? ` / ${c.totalUsageLimit}` : " (Unlimited)"}
                      </td>

                      <td className="py-4 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            c.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/marketing/coupons/${c._id}`}
                          className="inline-flex h-8 items-center gap-1 px-3 rounded-lg border border-[var(--border)] text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil size={12} />
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No promotional coupons created yet. Click "Create Coupon" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal: Test Discount Rule */}
          {isPreviewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]">
                <h3 className="text-base font-black text-slate-800 mb-4">
                  Test Coupon Rule Evaluator
                </h3>

                <form onSubmit={handleTestPreview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WELCOME50"
                      value={previewCode}
                      onChange={(e) => setPreviewCode(e.target.value.toUpperCase())}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono uppercase font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Test Cart Subtotal (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={previewSubtotal}
                      onChange={(e) => setPreviewSubtotal(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(false)}
                      className="h-10 px-4 rounded-xl border text-xs font-bold text-slate-600"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={previewLoading}
                      className="h-10 px-5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
                    >
                      {previewLoading ? "Evaluating..." : "Run Preview"}
                    </button>
                  </div>
                </form>

                {previewResult && (
                  <div
                    className={`mt-4 p-4 rounded-2xl border text-xs ${
                      previewResult.eligible
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-red-50 border-red-200 text-red-900"
                    }`}
                  >
                    <p className="font-bold">
                      {previewResult.eligible ? "Eligible for Discount!" : "Ineligible / Rejected"}
                    </p>
                    {previewResult.eligible ? (
                      <div className="mt-2 space-y-1">
                        <p>Discount: <strong className="font-mono text-emerald-700">₹{previewResult.discountAmount}</strong></p>
                        <p>Final Payable: <strong className="font-mono text-slate-900">₹{previewResult.finalPayable}</strong></p>
                      </div>
                    ) : (
                      <p className="mt-1">{previewResult.reason}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
