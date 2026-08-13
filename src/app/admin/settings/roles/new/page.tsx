"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

const AVAILABLE_PERMISSIONS = [
  { group: "Dashboard", items: ["dashboard.view", "dashboard.export"] },
  { group: "Catalog & Products", items: ["catalog.view", "catalog.edit", "products.create", "products.edit", "categories.manage"] },
  { group: "Order Management", items: ["orders.view", "orders.pack", "orders.dispatch", "orders.cancel", "refunds.approve"] },
  { group: "Dark Stores & Logistics", items: ["stores.view", "stores.manage", "riders.view", "riders.assign", "riders.payouts"] },
  { group: "Marketing & Campaigns", items: ["marketing.view", "banners.manage", "coupons.manage", "notifications.broadcast"] },
  { group: "Settings & System", items: ["settings.view", "settings.fees.edit", "settings.tax.edit", "staff.manage", "audit.view"] },
];

export default function AdminNewRolePage() {
  const router = useRouter();
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/settings/roles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleName,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create custom role.");
      }

      setSuccess("Custom role created successfully.");
      setTimeout(() => {
        router.push("/admin/settings/roles");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to create custom role.");
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
              href="/admin/settings/roles"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)]">Create Custom RBAC Role</h1>
              <p className="text-xs text-[var(--text-muted)]">Configure granular platform permission matrices</p>
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
                <ShieldCheck size={16} className="text-[var(--primary)]" />
                Role Identity
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INVENTORY_AUDITOR"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono uppercase font-bold outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-6">
              <h2 className="text-sm font-black text-slate-800">Permission Checkboxes</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {AVAILABLE_PERMISSIONS.map((group, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-xs font-black text-slate-900 block">{group.group}</span>
                    <div className="space-y-2">
                      {group.items.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                            className="rounded accent-[var(--primary)]"
                          />
                          <span className="font-mono text-[11px]">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/admin/settings/roles"
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
                {saving ? "Creating Role..." : "Create Custom Role"}
              </button>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}
