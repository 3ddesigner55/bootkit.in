"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Plus,
  RefreshCw,
  Send,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Eye,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type CampaignItem = {
  _id: string;
  campaignName: string;
  title: string;
  body: string;
  targetType: string;
  targetValue?: string;
  audienceType: string;
  scheduledAt?: string | null;
  status: string;
  estimatedRecipients: number;
  attemptedCount: number;
  successCount: number;
  createdAt: string;
};

export default function AdminMarketingNotificationsPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/notifications/campaigns`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error("Failed to load campaigns", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchCampaigns();
  }, [accountHydrated, accessToken, fetchCampaigns]);

  const handleTriggerBroadcast = async (campaignId: string) => {
    if (!confirm("Are you sure you want to broadcast this push notification to all active customers?")) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/notifications/campaigns/${campaignId}/trigger`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Broadcast failed.");
      alert("Broadcast sent successfully!");
      void fetchCampaigns();
    } catch (err: any) {
      alert(err.message);
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
                  <Bell size={22} className="text-purple-600" />
                  Push Notification Campaigns
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Customer engagement broadcasts, target deeplinks, and audience segmentation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchCampaigns()}
                className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              <Link
                href="/admin/marketing/notifications/new"
                className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                New Campaign
              </Link>
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Campaign</th>
                    <th className="py-3.5 px-4">Title & Message</th>
                    <th className="py-3.5 px-4">Audience</th>
                    <th className="py-3.5 px-4">Target Link</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {campaigns.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {c.campaignName}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-bold text-slate-900">{c.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{c.body}</p>
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-bold">
                        {c.audienceType}
                        <span className="text-[10px] text-slate-400 font-normal block">
                          ~{c.estimatedRecipients || 0} customers
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-600 text-[11px]">
                        {c.targetType}: {c.targetValue || "home"}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            c.status === "SENT"
                              ? "bg-emerald-50 text-emerald-700"
                              : c.status === "SCHEDULED"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        {c.status !== "SENT" && (
                          <button
                            type="button"
                            onClick={() => handleTriggerBroadcast(c._id)}
                            className="inline-flex h-8 items-center gap-1 px-2.5 rounded-lg bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700"
                          >
                            <Send size={11} />
                            Send
                          </button>
                        )}

                        <Link
                          href={`/admin/marketing/notifications/${c._id}`}
                          className="inline-flex h-8 items-center gap-1 px-2.5 rounded-lg border border-[var(--border)] text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye size={12} />
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No push notification campaigns created yet. Click "New Campaign" to compose one.
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
