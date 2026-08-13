"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Save,
  AlertCircle,
  CheckCircle,
  Shield,
  LogOut,
  UserX,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type StaffDetail = {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function AdminEditStaffPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = use(params);
  const router = useRouter();
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    role: "STORE_MANAGER",
    status: "ACTIVE",
  });

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStaff = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/settings/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && data.staff) {
        setStaff(data.staff);
        setForm({
          firstName: data.staff.firstName || "",
          lastName: data.staff.lastName || "",
          role: data.staff.role || "STORE_MANAGER",
          status: data.staff.status || "ACTIVE",
        });
      }
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, staffId]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchStaff();
  }, [accountHydrated, accessToken, fetchStaff]);

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
      const res = await fetch(`${baseUrl}/admin/settings/staff/${staffId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update staff member.");
      setSuccess("Staff member updated successfully.");
      void fetchStaff();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate this staff account?")) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/settings/staff/${staffId}/deactivate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to deactivate staff.");
      setSuccess("Staff member deactivated.");
      void fetchStaff();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRevokeSessions = async () => {
    if (!confirm("Revoke all active sessions for this user immediately?")) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/settings/staff/${staffId}/revoke-sessions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to revoke sessions.");
      setSuccess("Active sessions revoked.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-slate-500 text-sm">
          Loading staff details...
        </Container>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-red-600 text-sm font-bold">
          Staff member not found.
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/settings/staff"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-[var(--text-primary)]">
                    {staff.firstName} {staff.lastName}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      staff.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {staff.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono">{staff.email} • {staff.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRevokeSessions}
                className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5"
              >
                <LogOut size={14} />
                Revoke Sessions
              </button>

              {staff.status === "ACTIVE" && (
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="h-10 px-4 rounded-xl border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 flex items-center gap-1.5"
                >
                  <UserX size={14} />
                  Deactivate
                </button>
              )}
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
              <h2 className="text-sm font-black text-slate-800">Edit Staff Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
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
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">System Role</label>
                  <select
                    name="role"
                    required
                    value={form.role}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                  >
                    <option value="STORE_MANAGER">STORE_MANAGER</option>
                    <option value="DISPATCH_MANAGER">DISPATCH_MANAGER</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="MARKETING_MANAGER">MARKETING_MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Status</label>
                  <select
                    name="status"
                    required
                    value={form.status}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
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
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}
