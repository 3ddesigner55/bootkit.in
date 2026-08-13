"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Send,
  XCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type CampaignDetail = {
  _id: string;
  campaignName: string;
  title: string;
  body: string;
  imageUrl?: string;
  targetType: string;
  targetValue?: string;
  audienceType: string;
  scheduledAt?: string | null;
  status: string;
  estimatedRecipients: number;
  attemptedCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
};

export default function AdminCampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCampaign = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/notifications/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        setCampaign(data.campaign);
      }
    } catch (err) {
      console.error("Failed to load campaign", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, campaignId]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchCampaign();
  }, [accountHydrated, accessToken, fetchCampaign]);

  const handleSendBroadcast = async () => {
    if (!confirm("Are you sure you want to broadcast this push notification immediately?")) return;
    setIsSending(true);
    setError("");
    setSuccess("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/notifications/campaigns/${campaignId}/trigger`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to trigger broadcast.");
      setSuccess("Push broadcast successfully dispatched to recipients.");
      void fetchCampaign();
    } catch (err: any) {
      setError(err.message || "Broadcast failed.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelCampaign = async () => {
    if (!confirm("Are you sure you want to cancel this campaign?")) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/notifications/campaigns/${campaignId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to cancel campaign.");
      setSuccess("Campaign cancelled.");
      void fetchCampaign();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-slate-500 text-sm">
          Loading campaign details...
        </Container>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-red-600 text-sm font-bold">
          Campaign not found.
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/marketing/notifications"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-[var(--text-primary)]">{campaign.campaignName}</h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      campaign.status === "SENT"
                        ? "bg-emerald-50 text-emerald-700"
                        : campaign.status === "SCHEDULED"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono">Created on {new Date(campaign.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {campaign.status !== "SENT" && campaign.status !== "CANCELLED" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelCampaign}
                  className="h-10 px-4 rounded-xl border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50"
                >
                  Cancel Campaign
                </button>

                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleSendBroadcast}
                  className="h-10 px-5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <Send size={14} />
                  {isSending ? "Dispatching..." : "Send Broadcast Now"}
                </button>
              </div>
            )}
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

          <div className="space-y-6">
            {/* Live Message Preview Card */}
            <div className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Bell size={16} className="text-purple-600" />
                Notification Payload Preview
              </h2>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                  <span>BOOTKIT NOTIFICATION</span>
                  <span>Now</span>
                </div>
                <h3 className="text-xs font-black text-slate-900">{campaign.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{campaign.body}</p>
                {campaign.imageUrl && (
                  <div className="h-36 rounded-xl overflow-hidden mt-2">
                    <img src={campaign.imageUrl} alt="preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800">Targeting & Delivery Metrics</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Audience Segment</span>
                  <span className="font-bold text-slate-800">{campaign.audienceType}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Estimated Audience</span>
                  <span className="font-bold text-slate-800">{campaign.estimatedRecipients || 0} users</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Successful Dispatches</span>
                  <span className="font-bold text-emerald-600">{campaign.successCount || 0}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Deeplink Target</span>
                  <span className="font-mono text-slate-800">{campaign.targetType}: {campaign.targetValue || "home"}</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
