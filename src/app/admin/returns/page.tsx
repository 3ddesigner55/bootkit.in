"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCcw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
  Package,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type ReturnItem = {
  _id: string;
  order: { _id: string; orderNumber: string };
  customer: { firstName: string; lastName: string; phone: string };
  store?: { name: string };
  items: Array<{ product: string; quantity: number; disposition: string }>;
  reason: string;
  description?: string;
  status: "REQUESTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CLOSED";
  resolution?: string;
  createdAt: string;
};

export default function AdminReturnsPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [statusToSet, setStatusToSet] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [updating, setUpdating] = useState(false);

  const fetchReturns = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/returns`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReturns(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch returns", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchReturns();
  }, [accountHydrated, accessToken, fetchReturns]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    setUpdating(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/returns/${selectedReturn._id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: statusToSet,
          resolution: resolutionText,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update return status.");
      }
      setSelectedReturn(null);
      void fetchReturns();
    } catch (err: any) {
      alert(err.message || "Error updating return.");
    } finally {
      setUpdating(false);
    }
  };

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
                  Returns & Inventory Dispositions
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Review customer return requests and manage restock / damage dispositions
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchReturns()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Items</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {returns.map((ret) => (
                    <tr key={ret._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-black">
                        <Link
                          href={`/admin/orders/${ret.order?.orderNumber}`}
                          className="text-[var(--primary)] hover:underline"
                        >
                          #{ret.order?.orderNumber}
                        </Link>
                        <p className="text-[10px] text-slate-400 font-normal">
                          {new Date(ret.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800">
                          {ret.customer?.firstName} {ret.customer?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400">{ret.customer?.phone}</div>
                      </td>

                      <td className="py-4 px-4 text-slate-700">
                        <p className="font-bold">{ret.reason}</p>
                        {ret.description && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            {ret.description}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        {ret.items?.length || 0} items
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            ret.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700"
                              : ret.status === "REJECTED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {ret.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {ret.status === "REQUESTED" || ret.status === "UNDER_REVIEW" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReturn(ret);
                              setStatusToSet("APPROVED");
                            }}
                            className="inline-flex h-8 items-center gap-1 px-3 rounded-lg bg-[var(--primary)] text-[11px] font-bold text-white hover:brightness-95"
                          >
                            Review & Decide
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {returns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No return requests recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal */}
          {selectedReturn && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-800">
                    Process Return Request
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedReturn(null)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Decision
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="APPROVED"
                          checked={statusToSet === "APPROVED"}
                          onChange={() => setStatusToSet("APPROVED")}
                          className="accent-[var(--primary)]"
                        />
                        Approve & Restock Eligible
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="REJECTED"
                          checked={statusToSet === "REJECTED"}
                          onChange={() => setStatusToSet("REJECTED")}
                          className="accent-[var(--primary)]"
                        />
                        Reject Request
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Resolution Note
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="e.g. Items inspected and restocked in warehouse"
                      className="w-full p-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReturn(null)}
                      className="h-10 px-4 rounded-xl border border-[var(--border)] text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="h-10 px-5 rounded-xl bg-[var(--primary)] text-xs font-bold text-white hover:brightness-95 disabled:opacity-50"
                    >
                      {updating ? "Saving..." : "Confirm Decision"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
