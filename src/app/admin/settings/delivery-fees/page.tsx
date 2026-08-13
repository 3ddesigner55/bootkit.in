"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Save,
  RefreshCw,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  History,
  Calculator,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

export default function AdminDeliveryFeesPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [form, setForm] = useState({
    baseDeliveryFee: 2900,
    freeDeliveryThreshold: 49900,
    handlingFee: 500,
    smallOrderFee: 1500,
    smallOrderThreshold: 14900,
    minimumOrderValue: 9900,
    nightFee: 2000,
    nightFeeStart: "23:00",
    nightFeeEnd: "06:00",
    surgeFee: 0,
    surgeActive: false,
  });

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Preview Calculator State
  const [testSubtotal, setTestSubtotal] = useState("350");
  const [testNight, setTestNight] = useState(false);
  const [testSurge, setTestSurge] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const [fRes, hRes] = await Promise.all([
        fetch(`${baseUrl}/admin/settings/delivery-fees`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/settings/delivery-fees/history`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const [fData, hData] = await Promise.all([fRes.json(), hRes.json()]);

      if (fData.success && fData.settings && fData.settings.value) {
        setForm(fData.settings.value);
      }
      if (hData.success && Array.isArray(hData.history)) {
        setHistory(hData.history);
      }
    } catch (err) {
      console.error("Failed to load delivery fee settings", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchData();
  }, [accountHydrated, accessToken, fetchData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name.includes("Time") || name.includes("Start") || name.includes("End")) {
      setForm((prev) => ({ ...prev, [name]: value }));
    } else {
      // Convert Rupee input to Paise
      setForm((prev) => ({ ...prev, [name]: Math.round(parseFloat(value) * 100) || 0 }));
    }
  };

  const handleActivateNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/settings/delivery-fees/activate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to publish new fee configuration version.");
      setSuccess("New fee configuration version published and activated.");
      void fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRunPreview = async () => {
    setPreviewLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const subtotalInPaise = Math.round(parseFloat(testSubtotal) * 100) || 35000;
      const res = await fetch(`${baseUrl}/admin/settings/delivery-fees/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartSubtotal: subtotalInPaise,
          isNightTime: testNight,
          surgeActive: testSurge,
        }),
      });
      const data = await res.json();
      if (data.success && data.calculation) {
        setPreviewResult(data.calculation);
      }
    } catch (err) {
      console.error("Preview failed", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/admin/settings"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                <DollarSign size={22} className="text-blue-600" />
                Delivery & Platform Fees Engine
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Versioned fee schedule in integer paise with zero-write calculation preview
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <form onSubmit={handleActivateNewVersion} className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-black text-slate-800">Core Delivery & Handling Charges</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Base Delivery Fee (₹) *</label>
                    <input
                      type="number"
                      name="baseDeliveryFee"
                      min="0"
                      step="0.01"
                      required
                      value={form.baseDeliveryFee / 100}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Free Delivery Above (₹) *</label>
                    <input
                      type="number"
                      name="freeDeliveryThreshold"
                      min="0"
                      step="0.01"
                      required
                      value={form.freeDeliveryThreshold / 100}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Handling / Packaging Fee (₹) *</label>
                    <input
                      type="number"
                      name="handlingFee"
                      min="0"
                      step="0.01"
                      required
                      value={form.handlingFee / 100}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Minimum Order Subtotal (₹) *</label>
                    <input
                      type="number"
                      name="minimumOrderValue"
                      min="0"
                      step="0.01"
                      required
                      value={form.minimumOrderValue / 100}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-black text-slate-800">Small Order & Night Delivery Surcharges</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Small Order Surcharge (₹)</label>
                    <input
                      type="number"
                      name="smallOrderFee"
                      min="0"
                      step="0.01"
                      value={form.smallOrderFee / 100}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Apply Surcharge Below (₹)</label>
                    <input
                      type="number"
                      name="smallOrderThreshold"
                      min="0"
                      step="0.01"
                      value={form.smallOrderThreshold / 100}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Night Delivery Surcharge (₹)</label>
                    <input
                      type="number"
                      name="nightFee"
                      min="0"
                      step="0.01"
                      value={form.nightFee / 100}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Night Start</label>
                      <input
                        type="time"
                        name="nightFeeStart"
                        value={form.nightFeeStart}
                        onChange={handleChange}
                        className="w-full h-10 px-2 border border-[var(--border)] rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Night End</label>
                      <input
                        type="time"
                        name="nightFeeEnd"
                        value={form.nightFeeEnd}
                        onChange={handleChange}
                        className="w-full h-10 px-2 border border-[var(--border)] rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 px-6 rounded-xl bg-[var(--primary)] text-xs font-bold text-white hover:brightness-95 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  <Save size={15} />
                  {saving ? "Activating New Version..." : "Activate & Publish New Version"}
                </button>
              </div>
            </form>

            {/* Preview Tool & History */}
            <div className="space-y-6">
              {/* Preview Calculator */}
              <div className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Calculator size={16} className="text-purple-600" />
                  Fee Calculation Preview
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Test Subtotal (₹)</label>
                    <input
                      type="number"
                      value={testSubtotal}
                      onChange={(e) => setTestSubtotal(e.target.value)}
                      className="w-full h-9 px-3 border rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testNight}
                        onChange={(e) => setTestNight(e.target.checked)}
                        className="rounded accent-[var(--primary)]"
                      />
                      Night Time
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testSurge}
                        onChange={(e) => setTestSurge(e.target.checked)}
                        className="rounded accent-[var(--primary)]"
                      />
                      High Surge
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={previewLoading}
                    onClick={handleRunPreview}
                    className="w-full h-9 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
                  >
                    {previewLoading ? "Calculating..." : "Run Fee Pipeline"}
                  </button>

                  {previewResult && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Delivery Fee:</span>
                        <span className="font-bold">{previewResult.isFreeDelivery ? "FREE" : formatPrice(previewResult.deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Handling Fee:</span>
                        <span className="font-bold">{formatPrice(previewResult.handlingFee)}</span>
                      </div>
                      {previewResult.smallOrderFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Small Order Fee:</span>
                          <span className="font-bold">{formatPrice(previewResult.smallOrderFee)}</span>
                        </div>
                      )}
                      {previewResult.nightFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Night Surcharge:</span>
                          <span className="font-bold">{formatPrice(previewResult.nightFee)}</span>
                        </div>
                      )}
                      <div className="border-t pt-1.5 flex justify-between font-black text-slate-900">
                        <span>Total Payable:</span>
                        <span className="text-purple-700">{formatPrice(previewResult.totalPayable)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Version History */}
              <div className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 space-y-3">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-slate-400" />
                  Version History ({history.length})
                </h2>

                <div className="divide-y text-xs">
                  {history.map((h) => (
                    <div key={h._id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">Version #{h.configVersion}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700">
                        {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
