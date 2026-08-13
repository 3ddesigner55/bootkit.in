"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  History,
  RefreshCw,
  Clock,
  Shield,
  Layers,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type AuditLog = {
  _id: string;
  actor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  role: string;
  action: string;
  entityType: string;
  createdAt: string;
};

export default function AdminSettingsAuditPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/settings/audit`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchLogs();
  }, [accountHydrated, accessToken, fetchLogs]);

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
                  <History size={22} className="text-slate-700" />
                  Settings & Configurations Audit Trail
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Append-only immutable record of fee activations, tax updates, staff modifications, and RBAC actions
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchLogs()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Module</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {l.actor ? `${l.actor.firstName} ${l.actor.lastName || ""}` : "System Admin"}
                        {l.actor?.email && (
                          <span className="text-[10px] text-slate-400 block font-normal font-mono">{l.actor.email}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700">
                          {l.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {l.action}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {l.entityType}
                      </td>
                    </tr>
                  ))}

                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No settings audit events recorded.
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
