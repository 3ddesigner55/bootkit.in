"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type DaySchedule = {
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  enabled: boolean;
  intervals: Array<{ open: string; close: string }>;
};

const DAYS: Array<DaySchedule["day"]> = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default function AdminStoreTimingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map((d) => ({
      day: d,
      enabled: true,
      intervals: [{ open: "07:00", close: "23:00" }],
    }))
  );

  const [storeName, setStoreName] = useState("Hub");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;

    const fetchTimings = async () => {
      try {
        setLoading(true);
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/admin/stores/${storeId}/timings`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.weeklySchedule) && data.weeklySchedule.length > 0) {
          setSchedule(data.weeklySchedule);
        }
      } catch (err) {
        console.error("Failed to load store timings", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchTimings();
  }, [accountHydrated, accessToken, storeId]);

  const handleToggleDay = (dayIndex: number) => {
    setSchedule((prev) => {
      const next = [...prev];
      next[dayIndex].enabled = !next[dayIndex].enabled;
      return next;
    });
  };

  const handleAddInterval = (dayIndex: number) => {
    setSchedule((prev) => {
      const next = [...prev];
      next[dayIndex].intervals.push({ open: "09:00", close: "18:00" });
      return next;
    });
  };

  const handleRemoveInterval = (dayIndex: number, intervalIndex: number) => {
    setSchedule((prev) => {
      const next = [...prev];
      next[dayIndex].intervals.splice(intervalIndex, 1);
      return next;
    });
  };

  const handleTimeChange = (
    dayIndex: number,
    intervalIndex: number,
    field: "open" | "close",
    value: string
  ) => {
    setSchedule((prev) => {
      const next = [...prev];
      next[dayIndex].intervals[intervalIndex][field] = value;
      return next;
    });
  };

  const handleCopyMondayToAll = () => {
    const monday = schedule.find((s) => s.day === "MONDAY");
    if (!monday) return;
    setSchedule(
      DAYS.map((d) => ({
        day: d,
        enabled: monday.enabled,
        intervals: monday.intervals.map((i) => ({ ...i })),
      }))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/stores/${storeId}/timings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weeklySchedule: schedule }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save timings.");
      }
      setSuccess("Operating hours & weekly schedule updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to save timings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-4xl">
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
                  Weekly Operating Timings (Asia/Kolkata)
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Configure daily shifts, opening intervals, and automated schedule closures
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyMondayToAll}
              className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Copy size={14} />
              Copy Monday to All Days
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

          <form onSubmit={handleSave} className="space-y-4">
            {schedule.map((dayItem, dIdx) => (
              <div
                key={dayItem.day}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition ${
                  dayItem.enabled ? "border-[var(--border)]" : "border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={dayItem.enabled}
                      onChange={() => handleToggleDay(dIdx)}
                      className="h-4 w-4 accent-[var(--primary)] rounded"
                    />
                    <span className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      {dayItem.day}
                    </span>
                  </div>

                  {dayItem.enabled && (
                    <button
                      type="button"
                      onClick={() => handleAddInterval(dIdx)}
                      className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} />
                      Add Shift / Interval
                    </button>
                  )}
                </div>

                {dayItem.enabled ? (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    {dayItem.intervals.map((interval, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-600">Open:</label>
                          <input
                            type="time"
                            required
                            value={interval.open}
                            onChange={(e) => handleTimeChange(dIdx, iIdx, "open", e.target.value)}
                            className="h-9 px-2 border border-[var(--border)] rounded-lg text-xs font-mono outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-600">Close:</label>
                          <input
                            type="time"
                            required
                            value={interval.close}
                            onChange={(e) => handleTimeChange(dIdx, iIdx, "close", e.target.value)}
                            className="h-9 px-2 border border-[var(--border)] rounded-lg text-xs font-mono outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        {dayItem.intervals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveInterval(dIdx, iIdx)}
                            className="h-9 w-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Closed all day</p>
                )}
              </div>
            ))}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-xl bg-[var(--primary)] text-xs font-bold text-white hover:brightness-95 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={15} />
                {saving ? "Saving Schedule..." : "Save Operating Hours"}
              </button>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}
