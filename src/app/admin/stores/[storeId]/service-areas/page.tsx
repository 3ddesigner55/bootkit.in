"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Upload,
  RefreshCw,
  Clock,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type DeliveryAreaItem = {
  _id: string;
  pincode: string;
  areaName: string;
  active: boolean;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  minimumOrderAmountOverride?: number;
};

type StoreDetail = {
  _id: string;
  name: string;
  slug: string;
  city: string;
  deliveryRadius: number;
};

export default function AdminStoreServiceAreasPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [store, setStore] = useState<StoreDetail | null>(null);
  const [areas, setAreas] = useState<DeliveryAreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add Single / Comma Pincode Form
  const [pincodeInput, setPincodeInput] = useState("");
  const [areaNameInput, setAreaNameInput] = useState("");
  const [deliveryFeeInput, setDeliveryFeeInput] = useState("0");
  const [etaInput, setEtaInput] = useState("10");
  const [minOrderInput, setMinOrderInput] = useState("0");
  const [adding, setAdding] = useState(false);

  const fetchStoreAndAreas = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");

      const [storeRes, areasRes] = await Promise.all([
        fetch(`${baseUrl}/admin/stores/${storeId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${baseUrl}/admin/stores/${storeId}/service-areas`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const storeData = await storeRes.json();
      const areasData = await areasRes.json();

      if (storeData.success && storeData.store) {
        setStore(storeData.store);
      }
      if (areasData.success && Array.isArray(areasData.serviceAreas)) {
        setAreas(areasData.serviceAreas);
      }
    } catch (err) {
      console.error("Failed to load service areas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchStoreAndAreas();
  }, [accountHydrated, accessToken, storeId]);

  const handleAddAreas = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAdding(true);

    const rawPincodes = pincodeInput
      .split(/[,;\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (rawPincodes.length === 0) {
      setError("Please provide at least one valid pincode.");
      setAdding(false);
      return;
    }

    const invalid = rawPincodes.filter((p) => !/^\d{6}$/.test(p));
    if (invalid.length > 0) {
      setError(`Invalid 6-digit Indian pincode(s): ${invalid.join(", ")}`);
      setAdding(false);
      return;
    }

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      let addedCount = 0;

      for (const pin of rawPincodes) {
        const res = await fetch(`${baseUrl}/admin/stores/${storeId}/service-areas`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pincode: pin,
            areaName: areaNameInput || `Area ${pin}`,
            deliveryFee: parseFloat(deliveryFeeInput) || 0,
            estimatedDeliveryMinutes: parseInt(etaInput, 10) || 10,
            minimumOrderAmountOverride: parseFloat(minOrderInput) || 0,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          addedCount++;
        } else {
          throw new Error(data.message || `Failed to add ${pin}`);
        }
      }

      setSuccess(`Successfully mapped ${addedCount} pincode(s) to Hub.`);
      setPincodeInput("");
      setAreaNameInput("");
      void fetchStoreAndAreas();
    } catch (err: any) {
      setError(err.message || "Failed to add service areas.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm("Are you sure you want to remove this service area mapping?")) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/stores/${storeId}/service-areas/${areaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete service area.");
      }
      void fetchStoreAndAreas();
    } catch (err: any) {
      alert(err.message || "Error deleting area.");
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
                href="/admin/stores"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[var(--text-primary)]">
                  Service Areas & Pincodes: {store ? store.name : "Hub"}
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Manage serviceable pincodes, delivery fees, and minimum order values
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchStoreAndAreas()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Add Pincode Form */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Plus size={16} className="text-[var(--primary)]" />
                  Add Serviceable Pincodes
                </h2>

                <form onSubmit={handleAddAreas} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pincode(s) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 400050, 400051"
                      value={pincodeInput}
                      onChange={(e) => setPincodeInput(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Separate multiple pincodes with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Area / Locality Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bandra West Central"
                      value={areaNameInput}
                      onChange={(e) => setAreaNameInput(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={deliveryFeeInput}
                        onChange={(e) => setDeliveryFeeInput(e.target.value)}
                        className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ETA (Mins)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={etaInput}
                        onChange={(e) => setEtaInput(e.target.value)}
                        className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Min Order Override (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minOrderInput}
                      onChange={(e) => setMinOrderInput(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={adding}
                    className="w-full h-10 rounded-xl bg-[var(--primary)] text-xs font-bold text-white hover:brightness-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Plus size={15} />
                    {adding ? "Mapping..." : "Map Pincode(s)"}
                  </button>
                </form>
              </div>

              {/* Geofence Map status */}
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <h3 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-amber-600" />
                  Polygon Geofence Status
                </h3>
                <p className="text-[11px] text-slate-500 italic">
                  Geofence map provider: Map provider not configured. Pincode and radius routing engine active.
                </p>
              </div>
            </div>

            {/* Right 2 Cols: Mapped Pincodes List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800">
                    Mapped Pincodes ({areas.length})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                        <th className="py-3.5 px-4">Pincode</th>
                        <th className="py-3.5 px-4">Area Name</th>
                        <th className="py-3.5 px-4">Delivery Fee</th>
                        <th className="py-3.5 px-4">ETA</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {areas.map((area) => (
                        <tr key={area._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 px-4 font-black font-mono text-[var(--primary)]">
                            {area.pincode}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800">
                            {area.areaName}
                          </td>
                          <td className="py-4 px-4 text-slate-700">
                            {formatPrice(area.deliveryFee)}
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            {area.estimatedDeliveryMinutes} mins
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteArea(area._id)}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                              title="Delete mapping"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {areas.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            No serviceable pincodes mapped to this Hub yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
