"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Settings,
  DollarSign,
  Percent,
  Users,
  ShieldCheck,
  History,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Server,
  Layers,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type SettingsSummary = {
  activeVersion: number;
  lastUpdated: string;
  status: string;
  staffCount: number;
  activeTaxSlabs: number;
};

type ProviderStatus = {
  name: string;
  status: string;
  mode: string;
};

export default function AdminSettingsOverviewPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [summary, setSummary] = useState<SettingsSummary | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const [sRes, pRes] = await Promise.all([
        fetch(`${baseUrl}/admin/settings/summary`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/settings/provider-status`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const [sData, pData] = await Promise.all([sRes.json(), pRes.json()]);
      if (sData.success && sData.summary) setSummary(sData.summary);
      if (pData.success && Array.isArray(pData.providers)) setProviders(pData.providers);
    } catch (err) {
      console.error("Failed to load settings summary", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchSettings();
  }, [accountHydrated, accessToken, fetchSettings]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-7xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                <Settings size={22} className="text-[var(--primary)]" />
                Platform Settings & Configurations
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Delivery fee calculations, Tax & GST rates, Staff management, and RBAC permission matrices
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchSettings()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Fee Config Version</span>
              <p className="text-2xl font-black text-slate-900">
                {loading ? "--" : `v${summary?.activeVersion ?? 1}`}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                {summary?.status ?? "PUBLISHED"}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Active Tax Slabs</span>
              <p className="text-2xl font-black text-purple-600">
                {loading ? "--" : summary?.activeTaxSlabs ?? 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">Configured GST categories</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Staff Accounts</span>
              <p className="text-2xl font-black text-blue-600">
                {loading ? "--" : summary?.staffCount ?? 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">Privileged staff & managers</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-1">Provider Engines</span>
              <p className="text-2xl font-black text-emerald-600">
                {loading ? "--" : providers.length}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">All systems operational</span>
            </div>
          </div>

          {/* Provider Status Check */}
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm mb-8 space-y-4">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Server size={16} className="text-emerald-600" />
              Real Backend Provider Connection Status
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {providers.map((p, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-900">{p.name}</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">{p.mode}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Core Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Delivery Fees */}
            <div className="bg-white p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <h2 className="text-base font-black text-slate-900">Delivery & Platform Fees</h2>
                <p className="text-xs text-slate-500">
                  Configure base delivery rates, free delivery thresholds, packaging fees, small-order surcharges, and night pricing.
                </p>
              </div>

              <div className="pt-4">
                <Link
                  href="/admin/settings/delivery-fees"
                  className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800"
                >
                  Manage Delivery Fees
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Tax & GST */}
            <div className="bg-white p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Percent size={20} />
                </div>
                <h2 className="text-base font-black text-slate-900">Tax / GST Slabs</h2>
                <p className="text-xs text-slate-500">
                  Manage GST tax slabs, HSN/SAC mappings, CGST/SGST ratios, and intra-state tax calculation policies.
                </p>
              </div>

              <div className="pt-4">
                <Link
                  href="/admin/settings/taxes"
                  className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800"
                >
                  Manage Tax Slabs
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Staff & Roles */}
            <div className="bg-white p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <h2 className="text-base font-black text-slate-900">Staff & RBAC Roles</h2>
                <p className="text-xs text-slate-500">
                  Manage staff accounts, assign system & custom roles, configure granular permission checkboxes, and revoke active sessions.
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <Link
                  href="/admin/settings/staff"
                  className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800"
                >
                  Manage Staff
                  <ChevronRight size={14} />
                </Link>
                <Link
                  href="/admin/settings/roles"
                  className="w-full h-10 rounded-xl border border-[var(--border)] text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50"
                >
                  <ShieldCheck size={14} />
                  Role Permissions
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
