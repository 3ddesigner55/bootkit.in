"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Truck,
  RefreshCw,
  CheckCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type PayoutItem = {
  _id: string;
  rider?: {
    _id: string;
    riderCode: string;
    user?: {
      firstName: string;
      lastName: string;
    };
    assignedStore?: {
      name: string;
    };
  };
  startDate: string;
  endDate: string;
  grossEarnings: number;
  netPayable: number;
  status: string;
  paymentUtr?: string;
  createdAt: string;
  paidAt?: string | null;
};

export default function AdminRiderPayoutsPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/riders/payouts/all`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.payouts)) {
        setPayouts(data.payouts);
      }
    } catch (err) {
      console.error("Failed to load payouts", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchPayouts();
  }, [accountHydrated, accessToken, fetchPayouts]);

  const totalPaid = payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + (p.netPayable || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/riders"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                  <DollarSign size={22} className="text-purple-600" />
                  Rider Weekly Payouts & Settlements
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Disbursement records, bank reference tracking, and net payable history
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchPayouts()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Total Settled Disbursements</span>
              <p className="text-2xl font-black text-purple-700">
                {formatPrice(totalPaid / 100)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Total Payout Records</span>
              <p className="text-2xl font-black text-slate-900">
                {payouts.length} settlements
              </p>
            </div>
          </div>

          {/* Payouts Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-black text-sm text-slate-800">
              Settlement Records
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Rider</th>
                    <th className="py-3.5 px-4">Hub</th>
                    <th className="py-3.5 px-4">Disbursed Amount</th>
                    <th className="py-3.5 px-4">UTR Reference</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payouts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {p.rider?.user ? `${p.rider.user.firstName} ${p.rider.user.lastName}` : "Rider"}
                        <span className="text-[10px] font-mono text-slate-400 block font-normal">
                          {p.rider?.riderCode}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-700">
                        {p.rider?.assignedStore?.name || "Hub"}
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900">
                        {formatPrice((p.netPayable || 0) / 100)}
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-600">
                        {p.paymentUtr || "Manual Disbursal"}
                      </td>

                      <td className="py-4 px-4 text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {payouts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No payout settlements generated yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
