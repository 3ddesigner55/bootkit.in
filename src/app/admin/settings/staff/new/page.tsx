"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

export default function AdminNewStaffPage() {
  const router = useRouter();
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "STORE_MANAGER",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const res = await fetch(`${baseUrl}/admin/settings/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to onboard staff member.");
      }

      setSuccess("Staff member added successfully.");
      setTimeout(() => {
        router.push("/admin/settings/staff");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to add staff member.");
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
              href="/admin/settings/staff"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)]">Onboard New Staff Member</h1>
              <p className="text-xs text-[var(--text-muted)]">Assign administrative roles and operational staff privileges</p>
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
                <Users size={16} className="text-[var(--primary)]" />
                Staff Identity & Access Role
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="e.g. Rahul"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="e.g. Sharma"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="rahul.sharma@bootkit.in"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">System Role Assignment *</label>
                  <select
                    name="role"
                    required
                    value={form.role}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                  >
                    <option value="STORE_MANAGER">STORE_MANAGER (Dark Store & Inventory)</option>
                    <option value="DISPATCH_MANAGER">DISPATCH_MANAGER (In-Transit & Rider Dispatch)</option>
                    <option value="SUPPORT">SUPPORT (Tickets & Order Status)</option>
                    <option value="FINANCE">FINANCE (Refunds & Payouts)</option>
                    <option value="MARKETING_MANAGER">MARKETING_MANAGER (Banners, Coupons, Push)</option>
                    <option value="ADMIN">ADMIN (Full Operations)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/admin/settings/staff"
                className="h-11 px-5 rounded-xl border border-[var(--border)] text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-xl bg-[var(--primary)] text-xs font-bold text-white hover:brightness-95 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={15} />
                {saving ? "Onboarding..." : "Onboard Staff"}
              </button>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}
