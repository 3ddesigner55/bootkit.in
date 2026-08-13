"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

export default function AdminNewCampaignPage() {
  const router = useRouter();
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [form, setForm] = useState({
    campaignName: "",
    title: "",
    body: "",
    imageUrl: "",
    targetType: "offer",
    targetValue: "summer-savings",
    audienceType: "ALL_ACTIVE_CUSTOMERS",
    scheduledAt: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/marketing/notifications/campaigns`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create campaign.");
      }

      setSuccess("Push notification campaign created successfully.");
      setTimeout(() => {
        router.push("/admin/marketing/notifications");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to create campaign.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/admin/marketing/notifications"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)]">Compose Push Notification Broadcast</h1>
              <p className="text-xs text-[var(--text-muted)]">Configure push payload, deeplink destination, and audience segmentation</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Bell size={16} className="text-purple-600" />
                Notification Content & Payload
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Internal Campaign Name *</label>
                  <input
                    type="text"
                    name="campaignName"
                    required
                    placeholder="e.g. Weekend Flash Sale Announcement"
                    value={form.campaignName}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notification Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. ⚡ Flash Sale: 50% Off On Fresh Fruits!"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notification Image URL (Optional)</label>
                  <input
                    type="url"
                    name="imageUrl"
                    placeholder="https://..."
                    value={form.imageUrl}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notification Body Message *</label>
                  <textarea
                    rows={3}
                    name="body"
                    required
                    placeholder="e.g. Order fresh Alphonso mangoes, apples, and bananas delivered in 10 minutes at unbeatable prices."
                    value={form.body}
                    onChange={handleChange}
                    className="w-full p-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                Targeting & Scheduling
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Audience Segment *</label>
                  <select
                    name="audienceType"
                    required
                    value={form.audienceType}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                  >
                    <option value="ALL_ACTIVE_CUSTOMERS">All Active Opted-in Customers</option>
                    <option value="NEW_CUSTOMERS">New Customers (Joined last 7 days)</option>
                    <option value="CUSTOMERS_WITH_ORDERS">Customers With Completed Orders</option>
                    <option value="INACTIVE_CUSTOMERS">Inactive Customers (&gt; 14 days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Schedule Time (Optional)</label>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={form.scheduledAt}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Deeplink Target Type *</label>
                  <select
                    name="targetType"
                    required
                    value={form.targetType}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                  >
                    <option value="offer">Offer / Promotional Page</option>
                    <option value="category">Category Page</option>
                    <option value="product">Specific Product</option>
                    <option value="collection">Curated Collection</option>
                    <option value="search">Search Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Value / Slug *</label>
                  <input
                    type="text"
                    name="targetValue"
                    required
                    placeholder="e.g. fruits-vegetables"
                    value={form.targetValue}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/admin/marketing/notifications"
                className="h-11 px-5 rounded-xl border border-[var(--border)] text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={15} />
                {saving ? "Saving Campaign..." : "Save Campaign"}
              </button>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}
