"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock,
  User,
  RefreshCw,
  Tag,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type AuditLog = {
  _id: string;
  action: string;
  role?: string;
  reason?: string;
  timestamp: string;
  actor?: string;
};

export default function AdminStoreAuditPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/stores/${storeId}/audit`, {
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
  };

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchAuditLogs();
  }, [accountHydrated, accessToken, storeId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-4xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/stores"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[var(--text-primary)]">
                  Hub Operational Audit Log
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Immutable records of timings changes, service area edits, offline toggles, and surge actions
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchAuditLogs()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 font-medium">
              {logs.map((log) => (
                <div key={log._id} className="p-4 hover:bg-slate-50/60 transition flex items-start gap-4">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-800">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {log.reason && (
                      <p className="text-slate-600 font-normal">{log.reason}</p>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Role: <strong>{log.role || "ADMIN"}</strong></span>
                    </div>
                  </div>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  No audit logs recorded for this Hub yet.
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
