"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  User,
  Power,
  Shield,
  Pencil,
  FileText,
  Boxes,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type StoreDetail = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  phone: string;
  email?: string;
  addressLine1: string;
  city: string;
  state: string;
  deliveryRadius: number;
  operationalStatus: string;
  managerName?: string;
  managerPhone?: string;
  active: boolean;
};

type ReadinessInfo = {
  readyForOrders: boolean;
  missingRequirements: string[];
};

export default function AdminStoreOverviewPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [store, setStore] = useState<StoreDetail | null>(null);
  const [readiness, setReadiness] = useState<ReadinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;

    const fetchStore = async () => {
      try {
        setLoading(true);
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const [sRes, rRes] = await Promise.all([
          fetch(`${baseUrl}/admin/stores/${storeId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/admin/stores/${storeId}/readiness`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const sData = await sRes.json();
        const rData = await rRes.json();

        if (sData.success && sData.store) {
          setStore(sData.store);
        }
        if (rData.success) {
          setReadiness(rData);
        }
      } catch (err) {
        console.error("Failed to load store overview", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchStore();
  }, [accountHydrated, accessToken, storeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-slate-500 text-sm">
          Loading Hub details...
        </Container>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-red-600 text-sm font-bold">
          Hub not found.
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-5xl">
          {/* Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/stores"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-[var(--text-primary)]">
                    {store.name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      store.operationalStatus === "OPEN"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {store.operationalStatus}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono">Code: {store.slug}</p>
              </div>
            </div>

            <Link
              href={`/admin/stores/${storeId}/edit`}
              className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5"
            >
              <Pencil size={14} />
              Edit Hub Details
            </Link>
          </div>

          {/* Readiness Card */}
          {readiness && (
            <div
              className={`p-4 rounded-2xl border mb-6 flex items-start gap-3 ${
                readiness.readyForOrders
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              {readiness.readyForOrders ? (
                <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <h3 className="font-bold text-sm">
                  {readiness.readyForOrders
                    ? "Hub Ready for Customer Orders"
                    : "Hub Incomplete (Not Ready for Orders)"}
                </h3>
                {readiness.missingRequirements.length > 0 && (
                  <p className="mt-1">
                    Missing: {readiness.missingRequirements.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Management Quick Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link
              href={`/admin/stores/${storeId}/service-areas`}
              className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <MapPin size={20} />
              </div>
              <h3 className="text-xs font-black text-slate-800 group-hover:text-[var(--primary)] flex items-center justify-between">
                Service Areas
                <ChevronRight size={14} className="text-slate-400" />
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Pincodes & delivery radius</p>
            </Link>

            <Link
              href={`/admin/stores/${storeId}/timings`}
              className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Clock size={20} />
              </div>
              <h3 className="text-xs font-black text-slate-800 group-hover:text-[var(--primary)] flex items-center justify-between">
                Weekly Timings
                <ChevronRight size={14} className="text-slate-400" />
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Operating shifts & closures</p>
            </Link>

            <Link
              href={`/admin/stores/${storeId}/emergency`}
              className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
                <Power size={20} />
              </div>
              <h3 className="text-xs font-black text-slate-800 group-hover:text-[var(--primary)] flex items-center justify-between">
                Emergency Controls
                <ChevronRight size={14} className="text-slate-400" />
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Offline & surge overrides</p>
            </Link>

            <Link
              href={`/admin/stores/${storeId}/audit`}
              className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <FileText size={20} />
              </div>
              <h3 className="text-xs font-black text-slate-800 group-hover:text-[var(--primary)] flex items-center justify-between">
                Operational Audit
                <ChevronRight size={14} className="text-slate-400" />
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Action & override logs</p>
            </Link>
          </div>

          {/* Hub Summary Details */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-800">Hub Overview</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block mb-0.5">Address</span>
                <span className="font-bold text-slate-800">{store.addressLine1}, {store.city}, {store.state}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Delivery Radius</span>
                <span className="font-bold text-slate-800">{store.deliveryRadius} km</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Contact</span>
                <span className="font-bold text-slate-800">{store.phone} {store.email ? `(${store.email})` : ""}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Manager</span>
                <span className="font-bold text-slate-800">{store.managerName || "Not assigned"} {store.managerPhone ? `(${store.managerPhone})` : ""}</span>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
