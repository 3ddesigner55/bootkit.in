"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import {
  Grid2X2,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Download,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
  Save,
  X,
  FileSpreadsheet,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import {
  ImageUploader,
  type ImageUploaderItem,
} from "@/components/admin/media";

type CategoryTreeNode = {
  id: string;
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  banner?: string;
  parentCategory?: string | null;
  level: number;
  fullPath: string;
  productCount: number;
  active: boolean;
  sortOrder: number;
  children?: CategoryTreeNode[];
};

type CategorySummary = {
  total: number;
  mainCategories: number;
  subcategories: number;
  leafCategories: number;
  active: number;
  inactive: number;
};

type CsvPreviewRow = {
  rowIndex: number;
  name: string;
  slug: string;
  parentSlug: string;
  description?: string;
  image?: string;
  icon?: string;
  banner?: string;
  active: boolean;
  sortOrder: number;
  errors: string[];
  status: "VALID" | "ERROR";
  computedLevel: number;
  fullPath: string;
  action: "CREATE" | "UPDATE";
};

export default function AdminCategoriesClient() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  // Data State
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [summary, setSummary] = useState<CategorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "L1" | "L2" | "L3">("ALL");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Add / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentCategory: "",
    description: "",
    image: "",
    icon: "",
    banner: "",
    active: true,
    sortOrder: 1,
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [formError, setFormError] = useState("");

  // CSV Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [validatingCsv, setValidatingCsv] = useState(false);
  const [csvPreviewRows, setCsvPreviewRows] = useState<CsvPreviewRow[]>([]);
  const [importMode, setImportMode] = useState<"CREATE_ONLY" | "UPSERT_BY_SLUG">("CREATE_ONLY");
  const [executingImport, setExecutingImport] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState("");

  const updateCategoryImage = async (items: ImageUploaderItem[]) => {
    const item = items[0];
    if (!item) {
      setFormData((current) => ({ ...current, image: "" }));
      return;
    }
    if (!item.file) {
      setFormData((current) => ({ ...current, image: item.url }));
      return;
    }
    if (!accessToken) {
      setFormError("Your admin session has expired. Please sign in again.");
      return;
    }
    try {
      const formDataObj = new FormData();
      formDataObj.append("image", item.file);

      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/categories/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataObj,
      });

      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Image upload failed");

      setFormData((current) => ({ ...current, image: data.data.image || "" }));
      setFormError("");
    } catch (uploadError) {
      setFormError(
        uploadError instanceof Error
          ? uploadError.message
          : "Category image could not be uploaded.",
      );
    }
  };

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const [tRes, sRes] = await Promise.all([
        fetch(`${baseUrl}/admin/categories/tree`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/categories/summary`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const [tData, sData] = await Promise.all([tRes.json(), sRes.json()]);

      if (tData.success && Array.isArray(tData.tree)) {
        setTree(tData.tree);
        // Expand root nodes by default
        const rootIds = new Set<string>(tData.tree.map((n: any) => n.id || n._id));
        setExpandedNodes(rootIds);
      }
      if (sData.success && sData.summary) {
        setSummary(sData.summary);
      }
    } catch (err) {
      console.error("Failed to load category data", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchData();
  }, [accountHydrated, accessToken, fetchData]);

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Flatten tree for Parent Category selector
  const availableParentOptions = useMemo(() => {
    const options: { id: string; name: string; fullPath: string; level: number }[] = [];
    const traverse = (nodes: CategoryTreeNode[], path: string, lvl: number) => {
      nodes.forEach((n) => {
        const curPath = path ? `${path} > ${n.name}` : n.name;
        // Level 1 and Level 2 can be parents. Level 3 (Leaf) CANNOT be a parent.
        if (lvl < 3) {
          options.push({ id: n.id || n._id, name: n.name, fullPath: curPath, level: lvl });
        }
        if (n.children && n.children.length > 0) {
          traverse(n.children, curPath, lvl + 1);
        }
      });
    };
    traverse(tree, "", 1);
    return options;
  }, [tree]);

  // Computed level for the category being edited/added
  const computedFormLevel = useMemo(() => {
    if (!formData.parentCategory) return 1;
    const parent = availableParentOptions.find((o) => o.id === formData.parentCategory);
    return parent ? parent.level + 1 : 1;
  }, [formData.parentCategory, availableParentOptions]);

  const handleOpenAdd = (parentCatId?: string) => {
    setEditingId(null);
    setFormError("");
    setFormData({
      name: "",
      slug: "",
      parentCategory: parentCatId || "",
      description: "",
      image: "",
      icon: "",
      banner: "",
      active: true,
      sortOrder: 1,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (node: CategoryTreeNode) => {
    setEditingId(node.id || node._id);
    setFormError("");
    setFormData({
      name: node.name,
      slug: node.slug,
      parentCategory: node.parentCategory ? String(node.parentCategory) : "",
      description: (node as any).description || "",
      image: node.image || "",
      icon: node.icon || "",
      banner: node.banner || "",
      active: node.active !== false,
      sortOrder: node.sortOrder || 1,
    });
    setIsFormOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCategory(true);
    setFormError("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const url = editingId ? `${baseUrl}/admin/categories/${editingId}` : `${baseUrl}/admin/categories`;
      const method = editingId ? "PATCH" : "POST";

      const payload = {
        ...formData,
        parentCategory: formData.parentCategory || null,
        sortOrder: parseInt(String(formData.sortOrder), 10) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save category.");

      setIsFormOpen(false);
      void fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleArchiveCategory = async (catId: string, name: string) => {
    if (!confirm(`Are you sure you want to archive category "${name}"?`)) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/categories/${catId}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Archive failed.");
      void fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CSV Import Handlers
  const handleValidateCsv = async () => {
    if (!importFile) return;
    setValidatingCsv(true);
    setImportError("");
    setImportResult(null);

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const fd = new FormData();
      fd.append("file", importFile);

      const res = await fetch(`${baseUrl}/admin/categories/import/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "CSV validation failed.");
      setCsvPreviewRows(data.rows || []);
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setValidatingCsv(false);
    }
  };

  const handleExecuteImport = async () => {
    const validRows = csvPreviewRows.filter((r) => r.status === "VALID");
    if (validRows.length === 0) {
      alert("No valid rows to import.");
      return;
    }

    setExecutingImport(true);
    setImportError("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/categories/import/execute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: validRows,
          mode: importMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "CSV import execution failed.");
      setImportResult(data);
      void fetchData();
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setExecutingImport(false);
    }
  };

  const downloadTemplate = () => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
    window.open(`${baseUrl}/admin/categories/import/template`, "_blank");
  };

  const handleExportCsv = () => {
    const rows: string[] = ["name,slug,parentSlug,description,image,icon,banner,active,sortOrder,seoTitle,seoDescription"];

    const escapeCsvValue = (val: string) => {
      const escaped = val.replace(/"/g, '""');
      if (escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")) {
        return `"${escaped}"`;
      }
      return escaped;
    };

    const traverse = (nodes: CategoryTreeNode[], parentSlug: string = "") => {
      nodes.forEach((node) => {
        const name = escapeCsvValue(node.name || "");
        const slug = escapeCsvValue(node.slug || "");
        const parent = escapeCsvValue(parentSlug);
        const description = "";
        const image = escapeCsvValue(node.image || "");
        const icon = escapeCsvValue(node.icon || "");
        const banner = escapeCsvValue(node.banner || "");
        const active = node.active ? "true" : "false";
        const sortOrder = String(node.sortOrder || 1);
        const seoTitle = escapeCsvValue(node.name || "");
        const seoDescription = "";

        const row = [
          name,
          slug,
          parent,
          description,
          image,
          icon,
          banner,
          active,
          sortOrder,
          seoTitle,
          seoDescription,
        ].join(",");
        rows.push(row);

        if (node.children && node.children.length > 0) {
          traverse(node.children, node.slug);
        }
      });
    };

    traverse(tree);

    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "categories_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render tree node recursive component
  const renderTreeNode = (node: CategoryTreeNode, depth: number = 1) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id || node._id);

    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = node.name.toLowerCase().includes(q) || node.slug.toLowerCase().includes(q) || node.fullPath.toLowerCase().includes(q);
      const childMatch = node.children?.some((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
      if (!match && !childMatch) return null;
    }

    // Apply level filter
    if (levelFilter !== "ALL") {
      const targetLvl = levelFilter === "L1" ? 1 : levelFilter === "L2" ? 2 : 3;
      if (node.level !== targetLvl && (!node.children || !node.children.some((c) => c.level === targetLvl))) {
        return null;
      }
    }

    return (
      <div key={node.id || node._id} className="w-full">
        <div
          className={`flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50/80 transition ${
            depth === 1 ? "bg-white font-bold" : depth === 2 ? "bg-slate-50/40 pl-8 font-medium" : "bg-slate-50/80 pl-16 font-normal"
          }`}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id || node._id)}
                className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-slate-200 text-slate-500"
              >
                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {node.image ? (
                <img src={node.image} alt={node.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs">{node.icon || "📦"}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-900 font-bold">{node.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    node.level === 1
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : node.level === 2
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  L{node.level} — {node.level === 1 ? "Main" : node.level === 2 ? "Subcategory" : "Leaf"}
                </span>

                {!node.active && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">
                    Inactive
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">/{node.slug}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Package size={13} className="text-slate-400" />
              <span>{node.productCount} products</span>
            </div>

            {node.level < 3 && (
              <button
                type="button"
                onClick={() => handleOpenAdd(node.id || node._id)}
                className="h-7 px-2.5 rounded-lg border border-[var(--border)] bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                title="Add child subcategory"
              >
                <Plus size={12} />
                Add Child
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenEdit(node)}
              className="h-7 px-2.5 rounded-lg border border-[var(--border)] bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
            >
              <Pencil size={11} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => handleArchiveCategory(node.id || node._id, node.name)}
              className="h-7 px-2.5 rounded-lg border border-red-200 bg-white text-[11px] font-bold text-red-700 hover:bg-red-50 flex items-center gap-1"
            >
              <Trash2 size={11} />
              Archive
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="divide-y divide-slate-100">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-7xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                <FolderTree size={22} className="text-[var(--primary)]" />
                Category Master & Three-Level Hierarchy
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Strict 3-level catalog structure (Main → Subcategory → Leaf) with CSV import engine
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadTemplate}
                className="h-10 px-3.5 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
              >
                <Download size={15} className="text-slate-500" />
                CSV Template
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="h-10 px-3.5 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
              >
                <Download size={15} className="text-slate-500" />
                Export CSV
              </button>

              <button
                type="button"
                onClick={() => {
                  setImportFile(null);
                  setCsvPreviewRows([]);
                  setImportResult(null);
                  setImportError("");
                  setIsImportOpen(true);
                }}
                className="h-10 px-3.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 flex items-center gap-1.5 shadow-sm"
              >
                <Upload size={15} />
                Import CSV
              </button>

              <button
                type="button"
                onClick={() => void fetchData()}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-[var(--border)] bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>

              <button
                type="button"
                onClick={() => handleOpenAdd()}
                className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block">Total</span>
              <p className="text-xl font-black text-slate-900">{summary?.total ?? 0}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-purple-600 block">L1 Main</span>
              <p className="text-xl font-black text-purple-700">{summary?.mainCategories ?? 0}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-blue-600 block">L2 Sub</span>
              <p className="text-xl font-black text-blue-700">{summary?.subcategories ?? 0}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600 block">L3 Leaf</span>
              <p className="text-xl font-black text-emerald-700">{summary?.leafCategories ?? 0}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600 block">Active</span>
              <p className="text-xl font-black text-slate-900">{summary?.active ?? 0}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block">Inactive</span>
              <p className="text-xl font-black text-slate-500">{summary?.inactive ?? 0}</p>
            </div>
          </div>

          {/* Notice: Home Merchandising Separation */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Category Master Notice:</strong> Home placement, banners, and layouts are controlled from{" "}
                <strong>Home Merchandising</strong>.
              </span>
            </div>
            <Link
              href="/admin/home-builder"
              className="px-3 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700 flex items-center gap-1 shrink-0"
            >
              Open Home Merchandising
              <ExternalLink size={12} />
            </Link>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search categories by name, slug or path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-[var(--border)] text-xs outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-slate-400 text-[11px]">Filter Level:</span>
              {(["ALL", "L1", "L2", "L3"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                    levelFilter === lvl
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-[var(--border)] hover:bg-slate-50"
                  }`}
                >
                  {lvl === "ALL" ? "All Levels" : lvl === "L1" ? "L1 Main" : lvl === "L2" ? "L2 Sub" : "L3 Leaf"}
                </button>
              ))}
            </div>
          </div>

          {/* Tree View Table */}
          <div className="bg-white rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/60 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 flex items-center justify-between">
              <span>Category Hierarchy Structure</span>
              <span>Actions & Assigned Products</span>
            </div>

            <div className="divide-y divide-slate-100">
              {tree.map((rootNode) => renderTreeNode(rootNode, 1))}

              {tree.length === 0 && (
                <div className="py-16 text-center text-xs text-slate-400">
                  No categories found. Click "Add Category" or "Import CSV" to get started.
                </div>
              )}
            </div>
          </div>

          {/* Modal: Add / Edit Category */}
          {isFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-800">
                      {editingId ? "Edit Category" : "Add New Category"}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                      Level {computedFormLevel} — {computedFormLevel === 1 ? "Main" : computedFormLevel === 2 ? "Subcategory" : "Leaf"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 mb-4">
                    <AlertCircle size={14} />
                    {formError}
                  </div>
                )}

                <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Parent Category *</label>
                    <select
                      value={formData.parentCategory}
                      onChange={(e) => setFormData((p) => ({ ...p, parentCategory: e.target.value }))}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                    >
                      <option value="">No Parent — Create Main Category (Level 1)</option>
                      {availableParentOptions
                        .filter((opt) => opt.id !== editingId)
                        .map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.fullPath} (Level {opt.level})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Fresh Fruits"
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                        className="w-full h-10 px-3 border rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Slug *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. fresh-fruits"
                        value={formData.slug}
                        onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value.toLowerCase() }))}
                        className="w-full h-10 px-3 border rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  {computedFormLevel === 1 ? (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Icon / Emoji</label>
                      <input
                        type="text"
                        placeholder="e.g. 🍎"
                        value={formData.icon}
                        onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
                        className="w-full h-10 px-3 border rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  ) : (
                    <div className="mt-1">
                      <ImageUploader
                        label={computedFormLevel === 2 ? "Sub-Category Image" : "Leaf Category Image"}
                        value={
                          formData.image
                            ? [
                                {
                                  id: "category-image",
                                  url: formData.image,
                                  name: "Category image",
                                  progress: formData.image.startsWith("blob:") ? 0 : 100,
                                  status: formData.image.startsWith("blob:")
                                    ? "ready"
                                    : "uploaded",
                                },
                              ]
                            : []
                        }
                        onChange={(items) => {
                          void updateCategoryImage(items);
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Category description..."
                      value={formData.description}
                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData((p) => ({ ...p, active: e.target.checked }))}
                        className="rounded accent-[var(--primary)]"
                      />
                      Active Status
                    </label>

                    <div className="flex items-center gap-2">
                      <label className="font-bold text-slate-700">Sort Order:</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                        className="w-20 h-9 px-2 border rounded-xl font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="h-10 px-4 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingCategory}
                      className="h-10 px-5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save size={14} />
                      {savingCategory ? "Saving..." : "Save Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: CSV Import Workflow */}
          {isImportOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={20} className="text-purple-600" />
                    <h3 className="text-base font-black text-slate-800">
                      Bulk Category CSV Import Engine
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsImportOpen(false)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                {importError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle size={14} />
                    {importError}
                  </div>
                )}

                {importResult && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Import Execution Completed! (Batch ID: {importResult.batchId})
                    </p>
                    <p>Created: <strong>{importResult.createdCount}</strong> • Updated: <strong>{importResult.updatedCount}</strong> • Skipped: <strong>{importResult.skippedCount}</strong></p>
                  </div>
                )}

                {/* Upload & Validate Step */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Select Category CSV File</span>
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="text-[11px] font-bold text-purple-700 underline"
                    >
                      Download Template CSV
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    />

                    <button
                      type="button"
                      disabled={!importFile || validatingCsv}
                      onClick={handleValidateCsv}
                      className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {validatingCsv ? "Validating..." : "Validate CSV"}
                    </button>
                  </div>
                </div>

                {/* Validation Preview Table */}
                {csvPreviewRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-slate-800">
                        Validation Preview ({csvPreviewRows.length} rows)
                      </span>
                      <div className="flex items-center gap-3 font-bold">
                        <span className="text-emerald-600">
                          ✓ {csvPreviewRows.filter((r) => r.status === "VALID").length} Valid
                        </span>
                        <span className="text-red-600">
                          ✕ {csvPreviewRows.filter((r) => r.status === "ERROR").length} Errors
                        </span>
                      </div>
                    </div>

                    <div className="border rounded-2xl overflow-hidden max-h-60 overflow-y-auto text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 border-b">
                            <th className="p-2">Row</th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Slug</th>
                            <th className="p-2">Parent</th>
                            <th className="p-2">Level</th>
                            <th className="p-2">Full Path</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-[11px]">
                          {csvPreviewRows.map((r) => (
                            <tr key={r.rowIndex} className={r.status === "ERROR" ? "bg-red-50/60" : "bg-white"}>
                              <td className="p-2 font-mono">{r.rowIndex}</td>
                              <td className="p-2 font-bold">{r.name}</td>
                              <td className="p-2 font-mono text-slate-500">{r.slug}</td>
                              <td className="p-2 font-mono text-slate-500">{r.parentSlug || "--"}</td>
                              <td className="p-2 font-bold">L{r.computedLevel}</td>
                              <td className="p-2 text-slate-600 truncate max-w-xs">{r.fullPath}</td>
                              <td className="p-2">
                                {r.status === "VALID" ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">
                                    VALID ({r.action})
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-800" title={r.errors.join(", ")}>
                                    ERROR
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="text-slate-500">Import Mode:</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === "CREATE_ONLY"}
                            onChange={() => setImportMode("CREATE_ONLY")}
                            className="accent-[var(--primary)]"
                          />
                          Create Only (Skip Existing)
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === "UPSERT_BY_SLUG"}
                            onChange={() => setImportMode("UPSERT_BY_SLUG")}
                            className="accent-[var(--primary)]"
                          />
                          Upsert By Slug
                        </label>
                      </div>

                      <button
                        type="button"
                        disabled={executingImport || csvPreviewRows.filter((r) => r.status === "VALID").length === 0}
                        onClick={handleExecuteImport}
                        className="h-10 px-6 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {executingImport ? "Executing..." : "Execute Bulk Import"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
