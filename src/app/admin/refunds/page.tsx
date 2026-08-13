"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Search,
  CheckCircle,
  Clock,
  RefreshCw,
  FileText,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type RefundItem = {
  _id: string;
  order: { _id: string; orderNumber: string; grandTotal: number };
  amount: number;
  type: "FULL" | "PARTIAL";
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  reason: string;
  idempotencyKey: string;
  initiatedBy?: { firstName: string; lastName: string };
  createdAt: string;
};

export default function AdminRefundsPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRefunds = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/refunds`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRefunds(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch refunds", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchRefunds();
  }, [accountHydrated, accessToken, fetchRefunds]);

  const filteredRefunds = refunds.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchOrder = r.order?.orderNumber.toLowerCase().includes(q);
    const matchReason = r.reason.toLowerCase().includes(q);
    return matchOrder || matchReason;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[var(--text-primary)]">
                  Refunds & Payment Ledger
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Audit log of all full and partial refund disbursements and idempotency keys
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchRefunds()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Search */}
          <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm mb-6 flex items-center">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                placeholder="Search by Order # or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)] focus:bg-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Date / Time</th>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Initiated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRefunds.map((ref) => (
                    <tr key={ref._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(ref.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-4 px-4 font-black">
                        <Link
                          href={`/admin/orders/${ref.order?.orderNumber}`}
                          className="text-[var(--primary)] hover:underline"
                        >
                          #{ref.order?.orderNumber}
                        </Link>
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900">
                        {formatPrice(ref.amount)}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-[10px] text-slate-600">
                          {ref.type}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-700 max-w-xs truncate">
                        {ref.reason}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            ref.status === "SUCCEEDED"
                              ? "bg-emerald-50 text-emerald-700"
                              : ref.status === "FAILED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          <CheckCircle size={12} />
                          {ref.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-500">
                        {ref.initiatedBy
                          ? `${ref.initiatedBy.firstName} ${ref.initiatedBy.lastName}`
                          : "System"}
                      </td>
                    </tr>
                  ))}

                  {filteredRefunds.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No refund transactions found
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
