"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Ticket,
  Bell,
  Image,
  TrendingUp,
  RefreshCw,
  Plus,
  ChevronRight,
  CheckCircle,
  Tag,
  Clock,
  Layers,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type MarketingSummary = {
  activeBanners: number;
  totalBanners: number;
  activeCoupons: number;
  totalCoupons: number;
  couponRedemptionsToday: number;
  discountGivenToday: number;
  notificationCampaignsSent: number;
  scheduledCampaigns: number;
};

export default function AdminMarketingOverviewPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [summary, setSummary] = useState<MarketingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/summary`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error("Failed to load marketing summary", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchSummary();
  }, [accountHydrated, accessToken, fetchSummary]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-7xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles size={22} className="text-[var(--primary)]" />
                Marketing & Promotions Engine
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Banner library, promo codes & discounts rule engine, and push notification campaigns
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchSummary()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Active Hero Banners</span>
              <p className="text-2xl font-black text-slate-900">
                {loading ? "--" : summary?.activeBanners ?? 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {summary?.totalBanners ?? 0} total banners in library
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Active Coupons</span>
              <p className="text-2xl font-black text-emerald-600">
                {loading ? "--" : summary?.activeCoupons ?? 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {summary?.totalCoupons ?? 0} coupons configured
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Discounts Given Today</span>
              <p className="text-2xl font-black text-purple-600">
                {loading ? "--" : formatPrice(summary?.discountGivenToday ?? 0)}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {summary?.couponRedemptionsToday ?? 0} redemptions today
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Push Broadcasts Sent</span>
              <p className="text-2xl font-black text-blue-600">
                {loading ? "--" : summary?.notificationCampaignsSent ?? 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {summary?.scheduledCampaigns ?? 0} campaigns scheduled
              </span>
            </div>
          </div>

          {/* Core Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Module 1: Banners Library */}
            <div className="bg-white p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Image size={20} />
                </div>
                <h2 className="text-base font-black text-slate-900">Hero Banners & Sliders</h2>
                <p className="text-xs text-slate-500">
                  Manage promotional hero carousels, category banners, click-through internal targets, and scheduling.
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <Link
                  href="/admin/marketing/banners"
                  className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800"
                >
                  Manage Banner Library
                  <ChevronRight size={14} />
                </Link>
                <Link
                  href="/admin/marketing/banners/new"
                  className="w-full h-10 rounded-xl border border-[var(--border)] text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50"
                >
                  <Plus size={14} />
                  Add New Banner
                </Link>
              </div>
            </div>

            {/* Module 2: Coupons & Discounts */}
            <div className="bg-white p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Ticket size={20} />
                </div>
                <h2 className="text-base font-black text-slate-900">Coupons & Promo Codes</h2>
                <p className="text-xs text-slate-500">
                  Configure flat/percentage discounts, min cart subtotals, per-customer limits, and test coupon calculations.
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <Link
                  href="/admin/marketing/coupons"
                  className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800"
                >
                  Manage Coupons
                  <ChevronRight size={14} />
                </Link>
                <Link
                  href="/admin/marketing/coupons/new"
                  className="w-full h-10 rounded-xl border border-[var(--border)] text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50"
                >
                  <Plus size={14} />
                  Create New Coupon
                </Link>
              </div>
            </div>

            {/* Module 3: Push Notifications */}
            <div className="bg-white p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <h2 className="text-base font-black text-slate-900">Push Notifications</h2>
                <p className="text-xs text-slate-500">
                  Compose broadcast push campaigns, audience targeting, scheduled releases, and test payload dispatch.
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <Link
                  href="/admin/marketing/notifications"
                  className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800"
                >
                  Campaigns List
                  <ChevronRight size={14} />
                </Link>
                <Link
                  href="/admin/marketing/notifications/new"
                  className="w-full h-10 rounded-xl border border-[var(--border)] text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50"
                >
                  <Plus size={14} />
                  New Push Campaign
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
