"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { Download, Upload, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import Link from "next/link";

type HubOption = {
  id: string;
  name: string;
  city: string;
};

type RowPreview = {
  index: number;
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
  data?: Record<string, any>;
  raw: Record<string, string>;
};

type PreviewResult = {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  rows: RowPreview[];
};

export default function AdminCatalogImportPage() {
  const { hydrated: accountHydrated, session } = useAccount();
  const accessToken = session?.accessToken || "";
  
  const [importType, setImportType] = useState<"brands" | "categories" | "products" | "inventory">("products");
  const [hubs, setHubs] = useState<HubOption[]>([]);
  const [selectedHubId, setSelectedHubId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [conflictAction, setConflictAction] = useState<"skip" | "update">("skip");
  const [executing, setExecuting] = useState(false);

  // Fetch hub list for products/inventory scoping
  useEffect(() => {
    if (!accountHydrated || !accessToken) return;

    const fetchHubs = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/admin/stores`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const payload = await res.json();
        if (payload.success && payload.data?.items) {
          const list = payload.data.items.map((item: any) => ({
            id: item.id || item._id,
            name: item.name,
            city: item.city
          }));
          setHubs(list);
          if (list.length > 0) setSelectedHubId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load hubs", err);
      }
    };

    void fetchHubs();
  }, [accessToken, accountHydrated]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setError("");
      setSuccess("");
    }
  };

  const downloadTemplate = async () => {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      window.open(`${baseUrl}/admin/catalog/import/templates/${importType}?token=${accessToken}`, "_blank");
    } catch (err: any) {
      setError("Failed to download template.");
    }
  };

  const validateFile = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("csv", file);

      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const url = `${baseUrl}/admin/catalog/import/validate?type=${importType}&hubId=${selectedHubId}`;
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || "CSV validation failed.");
      }

      setPreview(payload.data);
    } catch (err: any) {
      setError(err.message || "Failed to validate CSV file.");
    } finally {
      setLoading(false);
    }
  };

  const executeImport = async () => {
    if (!preview || preview.rows.length === 0) return;
    if (preview.invalidCount > 0) {
      setError("Cannot execute import when there are invalid rows. Please correct errors and re-upload.");
      return;
    }

    setExecuting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        type: importType,
        action: conflictAction,
        items: preview.rows.map((r) => r.data),
        hubId: selectedHubId
      };

      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/catalog/import/execute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || "Import execution failed.");
      }

      setSuccess(`Successfully imported ${resData.data.importedCount} records.`);
      setPreview(null);
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Failed to execute import.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-6">
            <h1 className="text-[26px] font-black tracking-[-0.04em] text-[var(--text-primary)]">
              CSV Import Center
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Upload and update Brands, Categories, Products, and StoreInventory in bulk.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Import Configuration Panel */}
            <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6 lg:col-span-1 h-fit">
              <h2 className="text-sm font-black text-[var(--text-primary)] mb-4">
                1. Configure Import
              </h2>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Import Type
                  </span>
                  <select
                    value={importType}
                    onChange={(e) => {
                      setImportType(e.target.value as any);
                      setPreview(null);
                      setError("");
                    }}
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                  >
                    <option value="products">Products Master</option>
                    <option value="inventory">Store Inventory</option>
                    <option value="categories">Categories Tree</option>
                    <option value="brands">Brands Master</option>
                  </select>
                </label>

                {/* Hub Selection (Required for Products/Inventory to sync StoreInventory) */}
                {(importType === "products" || importType === "inventory") && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                      Target Operational Hub
                    </span>
                    <select
                      value={selectedHubId}
                      onChange={(e) => setSelectedHubId(e.target.value)}
                      className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                    >
                      {hubs.map((hub) => (
                        <option key={hub.id} value={hub.id}>
                          {hub.name} ({hub.city})
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:bg-slate-50"
                >
                  <Download size={15} />
                  Download Template
                </button>

                <hr className="border-[var(--border)] my-4" />

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Upload CSV File
                  </span>
                  <div className="relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] bg-slate-50 transition">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <Upload size={24} className="text-[var(--text-muted)] mb-2" />
                    <span className="text-xs font-bold text-[var(--text-secondary)] text-center px-4">
                      {file ? file.name : "Choose CSV File"}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1">
                      Max file size: 5MB
                    </span>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={validateFile}
                  disabled={loading || !file}
                  className="w-full flex h-12 items-center justify-center bg-[var(--primary)] text-sm font-bold text-white rounded-xl hover:brightness-95 disabled:opacity-50"
                >
                  {loading ? "Validating File..." : "Analyze & Preview"}
                </button>
              </div>
            </div>

            {/* Validation Preview and Executions */}
            <div className="lg:col-span-2 space-y-6">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700 flex items-center gap-2 animate-bounce">
                  <CheckCircle size={16} />
                  {success}
                </div>
              )}

              {preview && (
                <div className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-sm font-black text-[var(--text-primary)]">
                        2. Validation Preview Summary
                      </h2>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        Verify row validations before executing writes.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="text-center bg-slate-50 px-3 py-1.5 rounded-lg border border-[var(--border)]">
                        <p className="text-[10px] font-bold text-[var(--text-secondary)]">Total</p>
                        <p className="text-sm font-black">{preview.totalRows}</p>
                      </div>
                      <div className="text-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-700">Valid</p>
                        <p className="text-sm font-black text-emerald-800">{preview.validCount}</p>
                      </div>
                      <div className="text-center bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        <p className="text-[10px] font-bold text-red-700">Errors</p>
                        <p className="text-sm font-black text-red-800">{preview.invalidCount}</p>
                      </div>
                      <div className="text-center bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-700">Duplicates</p>
                        <p className="text-sm font-black text-amber-800">{preview.duplicateCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-[var(--border)] rounded-2xl overflow-hidden mb-6 max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-[var(--border)] font-bold text-[var(--text-secondary)] h-10">
                          <th className="px-4 w-12 text-center">Row</th>
                          <th className="px-4 w-20">Status</th>
                          <th className="px-4">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row) => (
                          <tr
                            key={row.index}
                            className={`border-b border-[var(--border)] h-12 ${
                              row.status === "invalid"
                                ? "bg-red-50/50"
                                : row.status === "duplicate"
                                ? "bg-amber-50/50"
                                : ""
                            }`}
                          >
                            <td className="px-4 text-center font-bold">{row.index}</td>
                            <td className="px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  row.status === "valid"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : row.status === "invalid"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4">
                              {row.status === "invalid" ? (
                                <div className="space-y-0.5 text-red-700 font-semibold">
                                  {row.errors.map((err, idx) => (
                                    <p key={idx}>• {err}</p>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[var(--text-secondary)] truncate max-w-sm">
                                  {Object.entries(row.raw)
                                    .slice(0, 3)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(" | ")}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Conflict Action Selector */}
                  <div className="bg-slate-50 rounded-2xl border border-[var(--border)] p-4 mb-6">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] mb-2">
                      3. Conflict Resolution Strategy
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] mb-4">
                      Choose how to handle duplicate records that already exist in the database.
                    </p>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="conflict"
                          value="skip"
                          checked={conflictAction === "skip"}
                          onChange={() => setConflictAction("skip")}
                          className="h-4 w-4 text-[var(--primary)]"
                        />
                        <span className="text-xs font-semibold">Skip duplicates</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="conflict"
                          value="update"
                          checked={conflictAction === "update"}
                          onChange={() => setConflictAction("update")}
                          className="h-4 w-4 text-[var(--primary)]"
                        />
                        <span className="text-xs font-semibold">Overwrite / Update duplicates</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setPreview(null)}
                      className="h-12 border border-[var(--border)] px-6 text-sm font-bold text-[var(--text-secondary)] rounded-xl hover:bg-slate-50"
                    >
                      Clear Preview
                    </button>
                    <button
                      type="button"
                      onClick={executeImport}
                      disabled={executing || preview.invalidCount > 0}
                      className="h-12 bg-[var(--primary)] text-sm font-bold text-white px-6 rounded-xl hover:brightness-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {executing ? "Importing Records..." : "Execute Bulk Import"}
                    </button>
                  </div>
                </div>
              )}

              {!preview && !error && !success && (
                <div className="rounded-[26px] border-2 border-dashed border-[var(--border)] bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <HelpCircle size={40} className="text-[var(--text-muted)] mb-3" />
                  <h3 className="text-sm font-black text-[var(--text-primary)]">
                    No Preview Available
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1">
                    Select a CSV file, configure target details on the left, and click Analyze & Preview to validate rows before database insertion.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
