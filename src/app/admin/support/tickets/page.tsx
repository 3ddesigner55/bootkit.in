"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LifeBuoy,
  Search,
  AlertCircle,
  Clock,
  User,
  ChevronRight,
  RefreshCw,
  Tag,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type SupportTicket = {
  _id: string;
  ticketNumber: string;
  order?: { _id: string; orderNumber: string } | null;
  customer?: { firstName: string; lastName: string; phone: string } | null;
  store?: { name: string } | null;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "UNDER_REVIEW" | "WAITING_FOR_CUSTOMER" | "RESOLVED" | "CLOSED";
  description: string;
  assignedStaff?: { firstName: string; lastName: string } | null;
  createdAt: string;
};

export default function AdminSupportTicketsPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickets = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/support/tickets`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchTickets();
  }, [accountHydrated, accessToken, fetchTickets]);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = t.ticketNumber.toLowerCase().includes(q);
      const matchOrder = t.order?.orderNumber.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      if (!matchNum && !matchOrder && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-7xl">
          {/* Header */}
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
                  Customer Support Tickets
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Track and resolve missing items, damaged packages, and order issues
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchTickets()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm mb-6 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                placeholder="Search ticket #, order # or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)] focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Ticket Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Ticket</th>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Issue Type</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTickets.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-black">
                        <Link
                          href={`/admin/support/tickets/${t._id}`}
                          className="text-[var(--primary)] hover:underline"
                        >
                          #{t.ticketNumber}
                        </Link>
                        <p className="text-[10px] text-slate-400 font-normal">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-700">
                        {t.order ? `#${t.order.orderNumber}` : "N/A"}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                          <Tag size={12} className="text-slate-400" />
                          {t.type.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800">
                          {t.customer ? `${t.customer.firstName} ${t.customer.lastName}` : "Customer"}
                        </div>
                        <div className="text-[10px] text-slate-400">{t.customer?.phone || ""}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            t.priority === "HIGH"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : t.priority === "MEDIUM"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            t.status === "RESOLVED" || t.status === "CLOSED"
                              ? "bg-emerald-50 text-emerald-700"
                              : t.status === "UNDER_REVIEW"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {t.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/support/tickets/${t._id}`}
                          className="inline-flex h-8 items-center gap-1 px-3 rounded-lg border border-[var(--border)] text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          View Ticket
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No support tickets found
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
