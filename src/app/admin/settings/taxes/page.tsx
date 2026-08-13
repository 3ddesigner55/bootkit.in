"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Pencil,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type TaxSlab = {
  _id: string;
  name: string;
  ratePercentage: number;
  intraStateSplitRatio: number;
  hsnCode?: string;
  description?: string;
  createdAt: string;
};

export default function AdminTaxSettingsPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [slabs, setSlabs] = useState<TaxSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    ratePercentage: "5",
    intraStateSplitRatio: "0.5",
    hsnCode: "",
    description: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSlabs = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/settings/taxes`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.taxProfiles)) {
        setSlabs(data.taxProfiles);
      }
    } catch (err) {
      console.error("Failed to load tax slabs", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchSlabs();
  }, [accountHydrated, accessToken, fetchSlabs]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      name: "",
      ratePercentage: "5",
      intraStateSplitRatio: "0.5",
      hsnCode: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slab: TaxSlab) => {
    setEditingId(slab._id);
    setForm({
      name: slab.name,
      ratePercentage: slab.ratePercentage.toString(),
      intraStateSplitRatio: slab.intraStateSplitRatio.toString(),
      hsnCode: slab.hsnCode || "",
      description: slab.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const url = editingId ? `${baseUrl}/admin/settings/taxes/${editingId}` : `${baseUrl}/admin/settings/taxes`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save tax slab.");
      setSuccess("Tax slab saved successfully.");
      setIsModalOpen(false);
      void fetchSlabs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/settings"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                  <Percent size={22} className="text-purple-600" />
                  Tax & GST Slabs
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Configurable GST categories, CGST/SGST intra-state tax split ratios, and HSN code bindings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchSlabs()}
                className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                Add Tax Slab
              </button>
            </div>
          </div>

          {/* Slabs Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Tax Slab Name</th>
                    <th className="py-3.5 px-4">GST Rate (%)</th>
                    <th className="py-3.5 px-4">CGST / SGST Split</th>
                    <th className="py-3.5 px-4">HSN Code</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {slabs.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {s.name}
                        {s.description && (
                          <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{s.description}</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-black text-purple-700">
                        <span className="px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-200">
                          {s.ratePercentage}% GST
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-600 font-mono">
                        {s.ratePercentage * s.intraStateSplitRatio}% CGST + {s.ratePercentage * (1 - s.intraStateSplitRatio)}% SGST
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-500">
                        {s.hsnCode || "--"}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="inline-flex h-8 items-center gap-1 px-3 rounded-lg border border-[var(--border)] text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}

                  {slabs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No GST tax slabs created yet. Click "Add Tax Slab" to configure one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]">
                <h3 className="text-base font-black text-slate-800 mb-4">
                  {editingId ? "Edit Tax Slab" : "Create New Tax Slab"}
                </h3>

                {error && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl mb-4 font-medium flex items-center gap-2">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Slab Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Standard GST 5%"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full h-10 px-3 border rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GST Rate Percentage (%) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={form.ratePercentage}
                      onChange={(e) => setForm((p) => ({ ...p, ratePercentage: e.target.value }))}
                      className="w-full h-10 px-3 border rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">HSN / SAC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 0804"
                      value={form.hsnCode}
                      onChange={(e) => setForm((p) => ({ ...p, hsnCode: e.target.value }))}
                      className="w-full h-10 px-3 border rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Fresh fruits, vegetables and edible goods"
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="h-10 px-4 rounded-xl border text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-10 px-5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Slab"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
