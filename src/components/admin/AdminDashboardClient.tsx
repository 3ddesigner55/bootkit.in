"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  ChevronRight,
  Clock3,
  Grid2X2,
  Image,
  MapPin,
  PackageCheck,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Search,
  RefreshCw,
  AlertTriangle,
  User,
  Users,
  Rss,
  CheckCircle,
  Truck,
  Volume2,
  VolumeX,
  EyeOff,
  SearchCode,
  DollarSign
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";
import { getAdminStores, type AdminStoreData } from "@/services/adminStores.service";
import {
  getAdminDashboardOverview,
  getAdminDashboardLiveOperations,
  getAdminDashboardActions,
  getAdminGlobalSearch,
  hideStoreInventoryItem,
  type DashboardOverviewData,
  type DashboardLiveOperations,
  type DashboardActionsData,
  type GroupedSearchResult,
  type KanbanOrder
} from "@/services/adminDashboard.service";
import { updateAdminOrderStatus } from "@/services/adminOrders.service";

export default function AdminDashboardClient() {
  const { session } = useAccount();
  const token = session?.accessToken;

  // Filters state
  const [hubId, setHubId] = useState<string>("all");
  const [range, setRange] = useState<string>("today");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Data states
  const [stores, setStores] = useState<AdminStoreData[]>([]);
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [liveOps, setLiveOps] = useState<DashboardLiveOperations | null>(null);
  const [actionsData, setActionsData] = useState<DashboardActionsData | null>(null);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<GroupedSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modal / Confirm state
  const [confirmHideItem, setConfirmHideItem] = useState<{ id: string; productName: string } | null>(null);
  const [hideReason, setHideReason] = useState<string>("");
  const [hideLoading, setHideLoading] = useState<boolean>(false);

  // References for live order counts (to trigger chimes on new orders)
  const prevNewOrdersCountRef = useRef<number>(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesize chime using Web Audio API
  const playChime = (type: "info" | "critical" = "info") => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === "critical") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      }
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  // Load stores initially
  useEffect(() => {
    if (!token) return;
    getAdminStores(token, { limit: 100 })
      .then((res) => {
        setStores(res.stores);
      })
      .catch((err) => console.error("Error loading stores:", err));
  }, [token]);

  // Main data fetch function
  const fetchData = async (showLoader = false) => {
    if (!token) return;
    if (isFetching) return;

    if (showLoader) {
      setLoading(true);
    }
    setIsFetching(true);
    setError(null);

    try {
      const [overviewRes, liveOpsRes, actionsRes] = await Promise.all([
        getAdminDashboardOverview(token, range, hubId),
        getAdminDashboardLiveOperations(token, hubId),
        getAdminDashboardActions(token, hubId)
      ]);

      setOverview(overviewRes);
      setLiveOps(liveOpsRes);
      setActionsData(actionsRes);
      setLastUpdated(new Date());

      // Trigger audio notification if new orders arrive
      const currentNewOrdersCount = liveOpsRes.kanban.newOrders.length;
      if (currentNewOrdersCount > prevNewOrdersCountRef.current) {
        playChime("info");
      }
      prevNewOrdersCountRef.current = currentNewOrdersCount;
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err?.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Trigger fetch when filters change
  useEffect(() => {
    if (token) {
      void fetchData(true);
    }
  }, [token, range, hubId]);

  // Polling Auto-refresh logic (30s)
  useEffect(() => {
    if (!autoRefresh || !token) return;

    const interval = setInterval(() => {
      // Don't poll if the document/tab is hidden
      if (document.hidden) {
        console.log("Tab is hidden. Skipping auto-refresh poll.");
        return;
      }
      void fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, token, range, hubId, isFetching]);

  // Live order age calculator refresher
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000); // refresh time every 10s
    return () => clearInterval(timer);
  }, []);

  // Global search debounced lookup
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      if (!token) return;
      try {
        const results = await getAdminGlobalSearch(token, searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, token]);

  // Confirm and hide store inventory items locally in Hub
  const handleConfirmHide = async () => {
    if (!token || !confirmHideItem || !hideReason.trim()) return;
    setHideLoading(true);
    try {
      await hideStoreInventoryItem(token, confirmHideItem.id, hideReason.trim());
      setConfirmHideItem(null);
      setHideReason("");
      // Refresh inventory alerts
      void fetchData(false);
    } catch (err: any) {
      alert(err?.message || "Failed to hide item.");
    } finally {
      setHideLoading(false);
    }
  };

  // Mutate Order Kanban status
  const handleUpdateStatus = async (orderNumber: string, nextStatus: any) => {
    if (!token) return;
    try {
      await updateAdminOrderStatus(token, orderNumber, nextStatus);
      void fetchData(false);
    } catch (err: any) {
      alert(err?.message || "Failed to transition order status.");
    }
  };

  // Helper to compute time difference / SLA timers
  const getOrderAgeInMinutes = (createdAtString: string) => {
    const created = new Date(createdAtString).getTime();
    const diffMs = Date.now() - created;
    return Math.floor(diffMs / 60000);
  };

  // Helper to compute and return color codes for SLA Kanban
  const getSLAColor = (minutes: number, status: string) => {
    if (status === "DELIVERED") return "bg-green-50 text-green-700 border-green-200";
    if (minutes >= 15) return "bg-red-50 text-red-700 border-red-200 animate-pulse";
    if (status === "PACKING" && minutes >= 3) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Permission Denied</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          Please log in as an administrator or owner to view this dashboard.
        </p>
        <Link href="/auth/login" className="mt-6 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      
      {/* 1. Sticky Global Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3 sm:px-6 shadow-sm">
        <div className="mx-auto max-w-7xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Back to home" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-600 hover:text-indigo-600">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">BootKiT · Admin Core</p>
              <h1 className="text-xl font-black tracking-tight text-slate-900">Control Dashboard</h1>
            </div>
          </div>

          {/* Grouped Global Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Order #, phone, SKU, barcode..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:bg-white"
              />
              {searchLoading && (
                <div className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Grouped search drop down results */}
            {showSearchDropdown && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Search Results</span>
                  <button onClick={() => setShowSearchDropdown(false)} className="text-xs text-slate-400 hover:text-slate-900">Close</button>
                </div>

                {!searchResults || (searchResults.orders.length === 0 && searchResults.customers.length === 0 && searchResults.products.length === 0) ? (
                  <div className="py-6 text-center text-sm text-slate-400 font-medium">No results found for "{searchQuery}"</div>
                ) : (
                  <div className="space-y-4">
                    {/* Orders Group */}
                    {searchResults.orders.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-1.5">Orders</h4>
                        <div className="space-y-1">
                          {searchResults.orders.map((o) => (
                            <Link
                              key={o._id}
                              href={`/admin/orders?search=${o.orderNumber}`}
                              onClick={() => setShowSearchDropdown(false)}
                              className="block rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition font-semibold"
                            >
                              Order {o.orderNumber} · <span className="text-slate-400 font-bold uppercase">{o.status}</span> · {formatPrice(o.grandTotal)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customers Group */}
                    {searchResults.customers.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-wider mb-1.5">Customers</h4>
                        <div className="space-y-1">
                          {searchResults.customers.map((c) => (
                            <Link
                              key={c._id}
                              href={`/admin/customers?search=${c.phone}`}
                              onClick={() => setShowSearchDropdown(false)}
                              className="block rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition font-semibold"
                            >
                              {c.firstName} {c.lastName} · <span className="text-slate-400 font-normal">{c.phone}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products Group */}
                    {searchResults.products.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-wider mb-1.5">Products</h4>
                        <div className="space-y-1">
                          {searchResults.products.map((p) => (
                            <Link
                              key={p._id}
                              href={`/admin/products?search=${p.sku}`}
                              onClick={() => setShowSearchDropdown(false)}
                              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition font-semibold"
                            >
                              {p.thumbnail && (
                                <img src={p.thumbnail} alt="" className="h-6 w-6 rounded object-cover bg-slate-100" />
                              )}
                              <span>{p.name} · <span className="text-slate-400 font-mono font-medium">{p.sku}</span></span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Row: Hubs, Date, Auto Refresh, Manual Sync */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Hub Selector */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <Store size={15} className="ml-2 text-slate-400" />
              <select
                value={hubId}
                onChange={(e) => setHubId(e.target.value)}
                className="bg-transparent border-0 text-xs font-black text-slate-700 pr-4 pl-1 outline-none cursor-pointer"
              >
                <option value="all">All Hubs</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="bg-transparent border-0 text-xs font-black text-slate-700 pr-4 pl-2 outline-none cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_7_days">Last 7 Days</option>
              </select>
            </div>

            {/* Auto Refresh Toggle */}
            <label className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-3 w-3 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Auto (30s)</span>
            </label>

            {/* Sound Notification Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute audio alert" : "Unmute audio alert"}
              className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl border transition ${
                soundEnabled ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Manual Sync Button */}
            <button
              onClick={() => fetchData(true)}
              disabled={isFetching}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={15} className={`${isFetching ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            {/* Last Updated */}
            <div className="text-[10px] text-slate-400 font-bold ml-1 hidden sm:block">
              Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

        </div>
      </header>

      {/* Main Body Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => fetchData(true)} className="text-xs font-black uppercase text-red-600 hover:text-red-800 underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {/* Skeletal loader matching dashboard layout */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-white border border-slate-200" />
              ))}
            </div>
            <div className="h-96 animate-pulse rounded-2xl bg-white border border-slate-200" />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-60 animate-pulse rounded-2xl bg-white border border-slate-200" />
              <div className="h-60 animate-pulse rounded-2xl bg-white border border-slate-200" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 2. Top Metric Cards */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Card 1: Total Orders */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Orders</span>
                  <ShoppingBag size={18} className="text-indigo-500" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight">{overview?.metrics.totalOrders ?? 0}</span>
                  {overview && (
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                      overview.metrics.orderGrowthPercent >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {overview.metrics.orderGrowthPercent >= 0 ? "+" : ""}{overview.metrics.orderGrowthPercent}%
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] font-bold text-slate-400">
                  {range === "today" ? "vs yesterday same elapsed period" : range === "yesterday" ? "vs day before yesterday" : "vs previous 7 days"}
                </p>
              </div>

              {/* Card 2: GMV */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">GMV</span>
                  <DollarSign size={18} className="text-emerald-500" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight">{formatPrice(overview?.metrics.gmv ?? 0)}</span>
                  {overview && (
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                      overview.metrics.gmvGrowthPercent >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {overview.metrics.gmvGrowthPercent >= 0 ? "+" : ""}{overview.metrics.gmvGrowthPercent}%
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] font-bold text-slate-400">Excludes cancelled & failed orders</p>
              </div>

              {/* Card 3: Average Order Value */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">AOV</span>
                  <TrendingUp size={18} className="text-blue-500" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight">{formatPrice(overview?.metrics.aov ?? 0)}</span>
                </div>
                <p className="mt-1 text-[10px] font-bold text-slate-400">Qualifying GMV / order count</p>
              </div>

              {/* Card 4: Active Users (Availability Check) */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Active Users</span>
                  <Users size={18} className="text-amber-500" />
                </div>
                <div className="mt-4">
                  {overview?.capabilities.activeUsersAvailable ? (
                    <span className="text-3xl font-black tracking-tight">{overview.metrics.activeUsers ?? 0}</span>
                  ) : (
                    <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-xs font-black uppercase text-slate-500 tracking-wider">
                      Not configured
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[10px] font-bold text-slate-400">Real session activity tracking</p>
              </div>

            </section>

            {/* 3. 10-Minute SLA Kanban */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Live Funnel Operations</span>
                  </div>
                  <h2 className="mt-1 text-lg font-black tracking-tight">SLA Kanban Pipeline</h2>
                </div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1">
                  LIVE
                </span>
              </div>

              {/* Kanban Horizontal Scrolling Container */}
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                
                {/* Column 1: New Orders */}
                <KanbanColumn
                  title="New Orders"
                  count={liveOps?.kanban.newOrders.length ?? 0}
                  orders={liveOps?.kanban.newOrders ?? []}
                  getAge={getOrderAgeInMinutes}
                  getColor={getSLAColor}
                  onAction={handleUpdateStatus}
                  actionLabel="Confirm"
                  targetStatus="Confirmed"
                />

                {/* Column 2: Packing In Progress */}
                <KanbanColumn
                  title="Packing"
                  count={liveOps?.kanban.packing.length ?? 0}
                  orders={liveOps?.kanban.packing ?? []}
                  getAge={getOrderAgeInMinutes}
                  getColor={getSLAColor}
                  onAction={handleUpdateStatus}
                  actionLabel="Mark Ready"
                  targetStatus="Packing"
                  altAction={{ label: "Start Packing", target: "Packing" }}
                />

                {/* Column 3: Ready for Dispatch */}
                <KanbanColumn
                  title="Ready"
                  count={liveOps?.kanban.ready.length ?? 0}
                  orders={liveOps?.kanban.ready ?? []}
                  getAge={getOrderAgeInMinutes}
                  getColor={getSLAColor}
                  onAction={handleUpdateStatus}
                  actionLabel="Mark Out for Delivery"
                  targetStatus="Out for Delivery"
                />

                {/* Column 4: In Transit */}
                <KanbanColumn
                  title="Out for Delivery"
                  count={liveOps?.kanban.transit.length ?? 0}
                  orders={liveOps?.kanban.transit ?? []}
                  getAge={getOrderAgeInMinutes}
                  getColor={getSLAColor}
                  onAction={handleUpdateStatus}
                  actionLabel="Mark Delivered"
                  targetStatus="Delivered"
                />

                {/* Column 5: Delivered Last 1 Hour */}
                <KanbanColumn
                  title="Delivered (1h)"
                  count={liveOps?.kanban.deliveredLastHour.length ?? 0}
                  orders={liveOps?.kanban.deliveredLastHour ?? []}
                  getAge={getOrderAgeInMinutes}
                  getColor={getSLAColor}
                  onAction={handleUpdateStatus}
                  isDeliveredColumn
                />

              </div>
            </section>

            {/* 4. Fleet and Inventory Health Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              
              {/* Left Column: Rider Availability */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-4">Rider Availability</h3>
                
                {overview?.capabilities.riderMetricsAvailable && liveOps?.riders ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <RiderMetricTile label="Active Fleet" value={liveOps.riders.active} color="indigo" />
                    <RiderMetricTile label="Idle / Available" value={liveOps.riders.available} color="green" />
                    <RiderMetricTile label="On Delivery" value={liveOps.riders.onTrip} color="blue" />
                    <RiderMetricTile label="Offline" value={liveOps.riders.offline} color="slate" />
                    <RiderMetricTile label="Stale Heartbeat" value={liveOps.riders.stale} color="red" />
                  </div>
                ) : (
                  <div className="flex min-h-36 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200/50 p-6 text-center">
                    <Truck size={24} className="text-slate-400" />
                    <p className="mt-2 text-sm font-black text-slate-700">Rider Module Not Configured</p>
                    <p className="mt-1 text-xs text-slate-400">Fleet telemetry and driver routing metrics are unavailable.</p>
                  </div>
                )}
              </section>

              {/* Right Column: Inventory Alerts */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-4">Inventory Alerts</h3>
                
                <div className="space-y-4">
                  {/* Out of stock list */}
                  <div>
                    <span className="inline-flex rounded-md bg-red-50 border border-red-100 text-[10px] font-black uppercase tracking-wider text-red-700 px-2 py-0.5 mb-2">
                      Out of stock
                    </span>
                    {liveOps?.alerts.outOfStock.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold px-2 py-1 bg-slate-50 rounded-lg">All items stocked.</p>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {liveOps?.alerts.outOfStock.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 bg-red-50/30 border border-red-100/50 rounded-xl p-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.thumbnail && (
                                <img src={item.thumbnail} alt="" className="h-8 w-8 rounded-lg object-cover bg-slate-100 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-black truncate text-slate-800">{item.productName}</p>
                                <p className="text-[10px] font-mono text-slate-400 font-bold">{item.sku}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-red-600">Stock: {item.stock}</span>
                              <button
                                onClick={() => setConfirmHideItem({ id: item.id, productName: item.productName })}
                                className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-[10px] font-black text-red-700 hover:bg-red-50 transition"
                              >
                                <EyeOff size={11} /> Hide from App
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Low stock list */}
                  <div>
                    <span className="inline-flex rounded-md bg-yellow-50 border border-yellow-100 text-[10px] font-black uppercase tracking-wider text-yellow-700 px-2 py-0.5 mb-2">
                      Low Stock Alerts
                    </span>
                    {liveOps?.alerts.lowStock.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold px-2 py-1 bg-slate-50 rounded-lg">No stock warnings.</p>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {liveOps?.alerts.lowStock.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 bg-yellow-50/30 border border-yellow-100/50 rounded-xl p-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.thumbnail && (
                                <img src={item.thumbnail} alt="" className="h-8 w-8 rounded-lg object-cover bg-slate-100 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-black truncate text-slate-800">{item.productName}</p>
                                <p className="text-[10px] font-mono text-slate-400 font-bold">{item.sku}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-yellow-600">Stock: {item.stock}</span>
                              <Link
                                href={`/admin/inventory?search=${item.sku}`}
                                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 hover:bg-slate-50 transition"
                              >
                                Restock
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </section>

            </div>

            {/* 5. Action Center */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="text-base font-black tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> Action Center
              </h2>

              <div className="grid gap-6 lg:grid-cols-3">
                
                {/* Delayed Orders List */}
                <div className="lg:col-span-1">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Delayed Orders (&gt;15 min SLA)</h3>
                  {actionsData && actionsData.delayedOrders.length > 0 ? (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {actionsData.delayedOrders.map((o) => {
                        const age = getOrderAgeInMinutes(o.createdAt);
                        return (
                          <div key={o._id} className="rounded-xl border border-red-200 bg-red-50/20 p-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs font-black">
                              <span className="text-slate-900">{o.orderNumber}</span>
                              <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{age}m delay</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 flex justify-between">
                              <span>Hub: {o.store?.name || "Global"}</span>
                              <span className="uppercase text-slate-400 font-black">{o.status}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs font-black">{formatPrice(o.grandTotal)}</span>
                              <Link
                                href={`/admin/orders?search=${o.orderNumber}`}
                                className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                              >
                                Open Order
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200/50 p-4 text-center">
                      <CheckCircle size={20} className="text-green-500" />
                      <p className="mt-2 text-xs font-black text-slate-700">All orders within SLA limits</p>
                    </div>
                  )}
                </div>

                {/* Payment Failures & Discrepancies */}
                <div className="lg:col-span-1">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Payment Failures</h3>
                  {overview?.capabilities.paymentReconciliationAvailable && actionsData && actionsData.paymentFailures.length > 0 ? (
                    <div className="space-y-2.5">
                      {/* Placeholder code path if payments reconciled */}
                    </div>
                  ) : (
                    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200/50 p-4 text-center">
                      <DollarSign size={20} className="text-slate-400" />
                      <p className="mt-2 text-xs font-black text-slate-700">Reconciliation Not Configured</p>
                      <p className="mt-1 text-[10px] text-slate-400">Payment failure alerts require gateway mapping integration.</p>
                    </div>
                  )}
                </div>

                {/* Customer Support Tickets */}
                <div className="lg:col-span-1">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Customer Support Tickets</h3>
                  {overview?.capabilities.supportTicketsAvailable && actionsData && actionsData.supportTickets.length > 0 ? (
                    <div className="space-y-2.5">
                      {/* Placeholder code path if tickets module active */}
                    </div>
                  ) : (
                    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200/50 p-4 text-center">
                      <Users size={20} className="text-slate-400" />
                      <p className="mt-2 text-xs font-black text-slate-700">Support Ticket Module Not Configured</p>
                      <p className="mt-1 text-[10px] text-slate-400">Ticketing services and complaint pipelines are disabled.</p>
                    </div>
                  )}
                </div>

              </div>
            </section>

          </div>
        )}

      </main>

      {/* Hide item Confirmation Modal */}
      {confirmHideItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Confirm Hide Product</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to hide <strong className="text-slate-900">{confirmHideItem.productName}</strong> from active Hub catalog display?
            </p>
            <div className="mt-4">
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Reason for Hide</label>
              <textarea
                rows={3}
                placeholder="e.g. Out of stock, quality defect, shipping delay..."
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-900 outline-none focus:border-indigo-600"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setConfirmHideItem(null);
                  setHideReason("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHide}
                disabled={hideLoading || !hideReason.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-500 disabled:opacity-50"
              >
                {hideLoading ? "Hiding..." : "Hide from App"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Kanban Column Sub-Component
function KanbanColumn({
  title,
  count,
  orders,
  getAge,
  getColor,
  onAction,
  actionLabel,
  targetStatus,
  altAction,
  isDeliveredColumn = false
}: {
  title: string;
  count: number;
  orders: KanbanOrder[];
  getAge: (c: string) => number;
  getColor: (age: number, s: string) => string;
  onAction?: (orderNo: string, target: any) => Promise<void>;
  actionLabel?: string;
  targetStatus?: string;
  altAction?: { label: string; target: string };
  isDeliveredColumn?: boolean;
}) {
  return (
    <div className="flex-1 min-w-[280px] bg-slate-50 rounded-2xl border border-slate-200/60 p-3 max-h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-3.5 px-1">
        <span className="text-xs font-black text-slate-800">{title}</span>
        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-black text-slate-600">{count}</span>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-0.5 pr-1">
        {orders.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center text-center text-[10px] text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl">
            Empty Column
          </div>
        ) : (
          orders.map((o) => {
            const age = getAge(o.createdAt);
            return (
              <div
                key={o._id}
                className={`rounded-xl border bg-white p-3.5 shadow-sm transition hover:shadow-md flex flex-col gap-2.5 ${getColor(age, o.status)}`}
              >
                {/* Timer or Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 truncate">{o.orderNumber}</span>
                  {!isDeliveredColumn && (
                    <span className="text-[10px] font-black font-mono">
                      Age: {age}m
                    </span>
                  )}
                </div>

                {/* Items preview */}
                <div className="text-[11px] font-bold text-slate-600">
                  <div className="truncate max-w-full">
                    {o.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                  </div>
                </div>

                {/* Details Footer */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Hub: {o.store?.name || "Global"}</span>
                  <span className="text-slate-900 font-black">{formatPrice(o.grandTotal)}</span>
                </div>

                {/* Actions Trigger */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                  <Link
                    href={`/admin/orders?search=${o.orderNumber}`}
                    className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-700 transition"
                  >
                    View Details
                  </Link>

                  {/* Mutator Actions */}
                  {onAction && (
                    <div className="flex gap-1">
                      {altAction && o.status !== "PACKING" && (
                        <button
                          onClick={() => void onAction(o.orderNumber, altAction.target)}
                          className="rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-700 px-2 py-1 hover:bg-indigo-100 transition active:scale-95"
                        >
                          {altAction.label}
                        </button>
                      )}
                      <button
                        onClick={() => void onAction(o.orderNumber, targetStatus)}
                        className="rounded-lg bg-indigo-600 text-[10px] font-black text-white px-2.5 py-1 hover:bg-indigo-700 transition active:scale-95"
                      >
                        {actionLabel}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Rider Metric Tile helper
function RiderMetricTile({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: any = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    green: "bg-green-50 text-green-700 border-green-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
    red: "bg-red-50 text-red-700 border-red-100"
  };

  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color] || colorMap.slate}`}>
      <p className="text-lg font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}
