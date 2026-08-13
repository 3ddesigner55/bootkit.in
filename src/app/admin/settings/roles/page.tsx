"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Plus,
  RefreshCw,
  Lock,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type SystemRole = {
  roleName: string;
  isSystem: boolean;
  permissions: string[];
};

type CustomRoleItem = {
  _id: string;
  roleName: string;
  permissions: string[];
  createdAt: string;
};

export default function AdminRolesPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/settings/roles`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.systemRoles)) setSystemRoles(data.systemRoles);
        if (Array.isArray(data.customRoles)) setCustomRoles(data.customRoles);
      }
    } catch (err) {
      console.error("Failed to load roles", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchRoles();
  }, [accountHydrated, accessToken, fetchRoles]);

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
                  <ShieldCheck size={22} className="text-emerald-600" />
                  RBAC Roles & Permission Matrices
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Protected system roles and custom administrative permission profiles
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchRoles()}
                className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              <Link
                href="/admin/settings/roles/new"
                className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                Create Role
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            {/* System Roles */}
            <div className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Lock size={16} className="text-slate-400" />
                Protected Built-in System Roles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {systemRoles.map((r, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 font-mono">{r.roleName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700">
                        SYSTEM PROTECTED
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {r.permissions.map((p, pIdx) => (
                        <span key={pIdx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-600">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Roles */}
            <div className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                Custom Administrative Roles ({customRoles.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customRoles.map((r) => (
                  <div key={r._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 font-mono">{r.roleName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {r.permissions.map((p, pIdx) => (
                        <span key={pIdx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-600">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {customRoles.length === 0 && (
                  <div className="py-6 col-span-2 text-center text-xs text-slate-400">
                    No custom roles created. Click "Create Role" to define specialized permission profiles.
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
