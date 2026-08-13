"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type StaffItem = {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function AdminStaffListPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/settings/staff`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.staff)) {
        setStaff(data.staff);
      }
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchStaff();
  }, [accountHydrated, accessToken, fetchStaff]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-6xl">
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
                  <Users size={22} className="text-blue-600" />
                  Staff & Administrative Users
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Privileged staff accounts, role designations, and session control
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchStaff()}
                className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              <Link
                href="/admin/settings/staff/new"
                className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                Add Staff Member
              </Link>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Staff Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {staff.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {s.firstName} {s.lastName}
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-mono">
                        {s.email}
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-mono">
                        {s.phone}
                      </td>

                      <td className="py-4 px-4 font-black">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                          {s.role}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/settings/staff/${s._id}`}
                          className="inline-flex h-8 items-center gap-1 px-3 rounded-lg border border-[var(--border)] text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil size={12} />
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No administrative staff accounts found.
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
