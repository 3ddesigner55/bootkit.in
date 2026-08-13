"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  Power,
  Flame,
  Ban,
  CheckCircle,
  Clock,
  ShieldAlert,
  Save,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type StoreDetail = {
  _id: string;
  name: string;
  slug: string;
  operationalStatus: string;
  emergencyOffline?: {
    reason: string;
    offlineUntil?: string | null;
  } | null;
};

export default function AdminStoreEmergencyPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Offline Form
  const [offlineReason, setOfflineReason] = useState("BAD_WEATHER");
  const [offlineUntil, setOfflineUntil] = useState("");
  const [isOfflineSubmitting, setIsOfflineSubmitting] = useState(false);

  // Surge Form
  const [surgeEnabled, setSurgeEnabled] = useState(false);
  const [surgeReason, setSurgeReason] = useState("Heavy rain and extreme order surge");
  const [surgeFee, setSurgeFee] = useState("30");
  const [isSurgeSubmitting, setIsSurgeSubmitting] = useState(false);

  // Category Override Form
  const [categoryIdToStop, setCategoryIdToStop] = useState("");
  const [categoryStopReason, setCategoryStopReason] = useState("Cold storage power interruption");
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);

  const fetchStore = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && data.store) {
        setStore(data.store);
        setSurgeEnabled(data.store.operationalStatus === "HIGH_DEMAND");
      }
    } catch (err) {
      console.error("Failed to load store", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchStore();
  }, [accountHydrated, accessToken, storeId]);

  const handleToggleOffline = async (setOffline: boolean) => {
    setIsOfflineSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const endpoint = setOffline ? `/admin/stores/${storeId}/offline` : `/admin/stores/${storeId}/online`;
      const body = setOffline
        ? { reason: offlineReason, offlineUntil: offlineUntil || null }
        : {};

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update offline status.");
      }

      setSuccess(
        setOffline
          ? `Hub taken offline. ${data.activeOrdersCount || 0} active orders remain processable.`
          : "Hub successfully restored to OPEN status."
      );
      void fetchStore();
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setIsOfflineSubmitting(false);
    }
  };

  const handleToggleSurge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSurgeSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/stores/${storeId}/high-demand`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !surgeEnabled,
          reason: surgeReason,
          temporaryFee: parseFloat(surgeFee),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update surge status.");
      }
      setSurgeEnabled(!surgeEnabled);
      setSuccess(`Surge fee mode ${!surgeEnabled ? "ENABLED" : "DISABLED"} for this Hub.`);
      void fetchStore();
    } catch (err: any) {
      setError(err.message || "Failed to update surge mode.");
    } finally {
      setIsSurgeSubmitting(false);
    }
  };

  const handleStopCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryIdToStop) return;
    setIsCatSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/stores/${storeId}/category-overrides`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: categoryIdToStop,
          reason: categoryStopReason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to stop category.");
      }
      setSuccess("Category override applied. Items from this category are now hidden for this Hub.");
      setCategoryIdToStop("");
    } catch (err: any) {
      setError(err.message || "Failed to apply category override.");
    } finally {
      setIsCatSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/admin/stores"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)]">
                Emergency Controls: {store ? store.name : "Hub"}
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Real-time operational overrides, surge fees, and category stops
              </p>
            </div>
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
            {/* Section 1: Temporary Emergency Offline */}
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Power size={18} className="text-red-600" />
                  <h2 className="text-sm font-black text-slate-800">
                    Temporary Emergency Offline
                  </h2>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                    store?.operationalStatus === "TEMPORARILY_OFFLINE"
                      ? "bg-red-100 text-red-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {store?.operationalStatus === "TEMPORARILY_OFFLINE" ? "OFFLINE" : "ONLINE"}
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Immediately prevents new cart checks and order placements for this Hub while preserving in-progress packing and deliveries.
              </p>

              {store?.operationalStatus === "TEMPORARILY_OFFLINE" ? (
                <div className="bg-red-50 p-4 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-red-800">
                    Store is currently OFFLINE: {store.emergencyOffline?.reason}
                  </p>
                  <button
                    type="button"
                    disabled={isOfflineSubmitting}
                    onClick={() => handleToggleOffline(false)}
                    className="h-10 px-5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isOfflineSubmitting ? "Restoring..." : "Restore Store Online"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Reason Type
                      </label>
                      <select
                        value={offlineReason}
                        onChange={(e) => setOfflineReason(e.target.value)}
                        className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                      >
                        <option value="BAD_WEATHER">Bad Weather (Flooding / Rain)</option>
                        <option value="HIGH_DEMAND">High Demand Surge</option>
                        <option value="NO_RIDERS">Rider Shortage</option>
                        <option value="STORE_INCIDENT">Store Incident</option>
                        <option value="POWER_FAILURE">Power Failure / Grid Issue</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Offline Until (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={offlineUntil}
                        onChange={(e) => setOfflineUntil(e.target.value)}
                        className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isOfflineSubmitting}
                    onClick={() => handleToggleOffline(true)}
                    className="h-10 px-5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Power size={14} />
                    {isOfflineSubmitting ? "Processing..." : "Take Hub Offline Immediately"}
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: High-Demand Surge Fee */}
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-amber-500" />
                  <h2 className="text-sm font-black text-slate-800">
                    High Demand / Surge Delivery Fee
                  </h2>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                    surgeEnabled ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {surgeEnabled ? "SURGE ACTIVE" : "NORMAL"}
                </span>
              </div>

              <form onSubmit={handleToggleSurge} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Surge Delivery Fee (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={surgeFee}
                      onChange={(e) => setSurgeFee(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Surge Reason
                    </label>
                    <input
                      type="text"
                      value={surgeReason}
                      onChange={(e) => setSurgeReason(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSurgeSubmitting}
                  className={`h-10 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    surgeEnabled
                      ? "bg-slate-800 text-white hover:bg-slate-900"
                      : "bg-amber-500 text-white hover:bg-amber-600"
                  }`}
                >
                  <Flame size={14} />
                  {isSurgeSubmitting
                    ? "Updating..."
                    : surgeEnabled
                    ? "Disable Surge Fee"
                    : "Enable Surge Fee"}
                </button>
              </form>
            </div>

            {/* Section 3: Stop Category Override */}
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Ban size={18} className="text-red-500" />
                <h2 className="text-sm font-black text-slate-800">
                  Stop Specific Category (Hub Only)
                </h2>
              </div>

              <form onSubmit={handleStopCategory} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category ID / Slug
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. dairy-bread-eggs"
                      value={categoryIdToStop}
                      onChange={(e) => setCategoryIdToStop(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={categoryStopReason}
                      onChange={(e) => setCategoryStopReason(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCatSubmitting || !categoryIdToStop}
                  className="h-10 px-5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Ban size={14} />
                  {isCatSubmitting ? "Applying..." : "Stop Category for this Hub"}
                </button>
              </form>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
