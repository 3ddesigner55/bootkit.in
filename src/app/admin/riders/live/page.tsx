"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  MapPin,
  RefreshCw,
  Battery,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type LiveRider = {
  _id: string;
  riderCode: string;
  name: string;
  phone: string;
  hub: string;
  availabilityStatus: string;
  onboardingStatus: string;
  vehicleType: string;
  vehicleRegNumber: string;
  lastLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    recordedAt?: string;
  } | null;
  lastHeartbeatAt?: string | null;
  isGpsStale: boolean;
};

export default function AdminLiveFleetPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [fleet, setFleet] = useState<LiveRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchLiveFleet = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/riders/live`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.fleet)) {
        setFleet(data.fleet);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("Failed to load live fleet", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchLiveFleet();

    const interval = setInterval(() => {
      void fetchLiveFleet();
    }, 20000); // 20s live polling fallback

    return () => clearInterval(interval);
  }, [accountHydrated, accessToken, fetchLiveFleet]);

  const activeCount = fleet.filter((r) => r.availabilityStatus !== "OFFLINE").length;
  const idleCount = fleet.filter((r) => r.availabilityStatus === "AVAILABLE").length;
  const onTripCount = fleet.filter((r) => r.availabilityStatus === "ON_DELIVERY" || r.availabilityStatus === "ASSIGNED").length;
  const staleCount = fleet.filter((r) => r.isGpsStale && r.availabilityStatus !== "OFFLINE").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-7xl">
          {/* Header */}
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
                  <MapPin size={22} className="text-blue-600" />
                  Live Fleet Dispatch Tracking
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Real-time operational status, GPS telemetry, and dispatch readiness
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </span>

              <button
                type="button"
                onClick={() => void fetchLiveFleet()}
                className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Active On Duty</span>
              <p className="text-xl font-black text-blue-600">{activeCount}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Idle (Ready for Orders)</span>
              <p className="text-xl font-black text-emerald-600">{idleCount}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">On Delivery Trip</span>
              <p className="text-xl font-black text-purple-600">{onTripCount}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Stale GPS Pings</span>
              <p className="text-xl font-black text-amber-600">{staleCount}</p>
            </div>
          </div>

          {/* Map Status Notice */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-blue-400" />
                <h3 className="text-sm font-black">Live Telemetry & Geo-Routing</h3>
              </div>
              <p className="text-xs text-slate-400">
                Live rider list below shows direct server pings. Interactive visual map layer operates once custom Mapbox/Google Maps tiles are provided.
              </p>
            </div>
          </div>

          {/* Live Fleet Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-black text-sm text-slate-800">
              Live Fleet Active Status ({fleet.length})
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Rider</th>
                    <th className="py-3.5 px-4">Hub</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">GPS State</th>
                    <th className="py-3.5 px-4">Last Ping</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {fleet.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        <Link href={`/admin/riders/${r._id}`} className="hover:text-[var(--primary)] block">
                          {r.name}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">{r.riderCode}</span>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-700">
                        {r.hub}
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        {r.vehicleType} ({r.vehicleRegNumber})
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            r.availabilityStatus === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.availabilityStatus === "ON_DELIVERY" || r.availabilityStatus === "ASSIGNED"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.availabilityStatus}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {r.isGpsStale ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                            <AlertTriangle size={12} />
                            Stale (&gt; 5m)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <CheckCircle size={12} />
                            Active Ping
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {r.lastHeartbeatAt ? new Date(r.lastHeartbeatAt).toLocaleTimeString() : "No ping yet"}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/riders/${r._id}`}
                          className="inline-flex h-7 items-center gap-1 px-2.5 rounded-lg border border-[var(--border)] text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Details
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {fleet.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No active riders currently broadcasting location
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
