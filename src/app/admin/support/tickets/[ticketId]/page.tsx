"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LifeBuoy,
  User,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type TicketDetail = {
  _id: string;
  ticketNumber: string;
  order: {
    _id: string;
    orderNumber: string;
    grandTotal: number;
    status: string;
    createdAt: string;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  store: {
    name: string;
    city: string;
  };
  type: string;
  priority: string;
  status: string;
  description: string;
  affectedItems: Array<{
    product: { _id: string; name: string };
    quantity: number;
  }>;
  photos: string[];
  assignedStaff?: { firstName: string; lastName: string } | null;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string | null;
};

export default function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = use(params);
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [resolutionText, setResolutionText] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchTicket = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/support/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTicket(data.data);
        setStatus(data.data.status);
        setResolutionText(data.data.resolution || "");
      } else {
        setError(data.message || "Failed to load ticket.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchTicket();
  }, [accountHydrated, accessToken, ticketId]);

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setUpdating(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/support/tickets/${ticket._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          resolution: resolutionText,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update ticket.");
      }
      alert("Ticket updated successfully.");
      void fetchTicket();
    } catch (err: any) {
      alert(err.message || "Error updating ticket.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-slate-500 text-sm">
          Loading ticket details...
        </Container>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-red-600 text-sm font-bold">
          {error || "Ticket not found."}
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-6xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/support/tickets"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-[var(--text-primary)]">
                    Ticket #{ticket.ticketNumber}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">
                    {ticket.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Created {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {ticket.order && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/orders/${ticket.order.orderNumber}`}
                  className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <ShoppingBag size={15} />
                  View Order #{ticket.order.orderNumber}
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Issue Description & Resolution */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description Card */}
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-3">
                  Customer Issue Description
                </h2>
                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                  <div>
                    Type: <strong className="text-slate-800">{ticket.type.replaceAll("_", " ")}</strong>
                  </div>
                  <div>
                    Priority: <strong className="text-slate-800">{ticket.priority}</strong>
                  </div>
                </div>
              </div>

              {/* Resolution Form */}
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4">
                  Update Ticket & Resolution
                </h2>

                <form onSubmit={handleUpdateTicket} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ticket Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-11 px-3 border border-[var(--border)] rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[var(--primary)] bg-white"
                    >
                      <option value="OPEN">Open</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Internal Resolution Note / Customer Communication
                    </label>
                    <textarea
                      rows={4}
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Details of action taken, replacement dispatched, or refund issued..."
                      className="w-full p-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updating}
                      className="h-10 px-5 rounded-xl bg-[var(--primary)] text-xs font-bold text-white hover:brightness-95 disabled:opacity-50"
                    >
                      {updating ? "Saving..." : "Save Resolution"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Customer Info & Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                  <User size={16} className="text-[var(--primary)]" />
                  Customer Information
                </h2>
                <div className="text-xs space-y-1 text-slate-600">
                  <p className="font-bold text-slate-900">
                    {ticket.customer?.firstName} {ticket.customer?.lastName}
                  </p>
                  <p>{ticket.customer?.email}</p>
                  <p className="font-mono">{ticket.customer?.phone}</p>
                </div>
              </div>

              {ticket.order && (
                <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                  <h2 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[var(--primary)]" />
                    Associated Order
                  </h2>
                  <div className="text-xs space-y-1 text-slate-600">
                    <p>Order: <strong className="text-slate-900">#{ticket.order.orderNumber}</strong></p>
                    <p>Amount: <strong className="text-slate-900">{formatPrice(ticket.order.grandTotal)}</strong></p>
                    <p>Status: <strong className="text-slate-900">{ticket.order.status}</strong></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
