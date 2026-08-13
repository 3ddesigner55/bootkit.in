"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  Package,
  CheckCircle,
  AlertTriangle,
  Play,
  Check,
  ChevronRight,
  Boxes,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type HubOption = {
  id: string;
  name: string;
  city: string;
};

type OrderItem = {
  name: string;
  thumbnail: string;
  quantity: number;
  sellingPrice: number;
};

type LiveOrder = {
  _id: string;
  orderNumber: string;
  store: { _id: string; name: string } | string;
  user: { firstName: string; lastName: string; phone: string };
  items: OrderItem[];
  grandTotal: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  packingStartedAt?: string;
  readyAt?: string;
};

export default function AdminLivePackingDashboardPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [hubs, setHubs] = useState<HubOption[]>([]);
  const [selectedHubId, setSelectedHubId] = useState("");
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [audioContextAllowed, setAudioContextAllowed] = useState(false);

  const prevOrderCountRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API for synthetic local sound alerts
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio playback error", e);
    }
  }, [soundEnabled]);

  // Load Hub options
  useEffect(() => {
    if (!accountHydrated || !accessToken) return;

    const fetchHubs = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/admin/stores`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payload = await res.json();
        if (payload.success && payload.data?.items) {
          const list = payload.data.items.map((item: any) => ({
            id: item.id || item._id,
            name: item.name,
            city: item.city,
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

  // Fetch Live Orders
  const fetchLiveOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/orders/live`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const hubOrders = selectedHubId
          ? data.orders.filter((o: any) => {
              const storeId = typeof o.store === "object" ? o.store?._id : o.store;
              return String(storeId) === String(selectedHubId);
            })
          : data.orders;

        if (prevOrderCountRef.current > 0 && hubOrders.length > prevOrderCountRef.current) {
          playAlertSound();
        }
        prevOrderCountRef.current = hubOrders.length;
        setOrders(hubOrders);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.error("Error polling live orders", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedHubId, playAlertSound]);

  // Periodic fallback polling
  useEffect(() => {
    if (!accessToken) return;
    void fetchLiveOrders();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchLiveOrders();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [accessToken, fetchLiveOrders]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const handleUpdateStatus = async (orderNumber: string, nextStatus: string) => {
    setActionInProgress(orderNumber);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/orders/${orderNumber}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus, reason: `Updated from Packing Dashboard to ${nextStatus}` }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update order status.");
      }
      await fetchLiveOrders();
    } catch (err: any) {
      alert(err.message || "Status update failed.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter orders into kanban columns
  const newOrders = orders.filter((o) => o.status === "PLACED" || o.status === "CONFIRMED");
  const packingOrders = orders.filter((o) => o.status === "PACKING");
  const readyOrders = orders.filter((o) => o.status === "READY_FOR_PICKUP");

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />

      {/* Top Header Bar */}
      <div className="bg-white border-b border-[var(--border)] px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-[var(--text-primary)]">
                  Live Packing Dashboard
                </h1>
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Last synced: {lastSyncTime.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Hub Selector */}
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              {hubs.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name} ({hub.city})
                </option>
              ))}
            </select>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playAlertSound();
              }}
              className={`flex h-10 items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition ${
                soundEnabled
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-white border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {soundEnabled ? "Sound ON" : "Sound OFF"}
            </button>

            {/* Test Sound Button */}
            <button
              type="button"
              onClick={playAlertSound}
              className="flex h-10 items-center gap-1 px-3 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <Play size={13} />
              Test
            </button>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => void fetchLiveOrders()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            {/* Full-screen Toggle */}
            <button
              type="button"
              onClick={toggleFullScreen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Kanban Board */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: New Orders */}
          <div className="bg-slate-200/70 p-4 rounded-[26px] border border-slate-300/60 min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  New Orders
                </h2>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                {newOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {newOrders.map((order) => (
                <KanbanCard
                  key={order._id}
                  order={order}
                  actionLabel="Start Packing"
                  actionTargetStatus="PACKING"
                  onAction={() => handleUpdateStatus(order.orderNumber, "PACKING")}
                  isLoading={actionInProgress === order.orderNumber}
                />
              ))}
              {newOrders.length === 0 && (
                <div className="text-center py-12 text-xs font-bold text-slate-400">
                  No new orders waiting
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Packing In Progress */}
          <div className="bg-amber-50/70 p-4 rounded-[26px] border border-amber-200 min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="text-sm font-black text-amber-900 uppercase tracking-wider">
                  Packing in Progress
                </h2>
              </div>
              <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                {packingOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {packingOrders.map((order) => (
                <KanbanCard
                  key={order._id}
                  order={order}
                  actionLabel="Mark as Packed & Ready"
                  actionTargetStatus="READY_FOR_PICKUP"
                  onAction={() => handleUpdateStatus(order.orderNumber, "READY_FOR_PICKUP")}
                  isLoading={actionInProgress === order.orderNumber}
                />
              ))}
              {packingOrders.length === 0 && (
                <div className="text-center py-12 text-xs font-bold text-amber-400">
                  No orders currently being packed
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Ready for Dispatch */}
          <div className="bg-emerald-50/70 p-4 rounded-[26px] border border-emerald-200 min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-black text-emerald-900 uppercase tracking-wider">
                  Ready for Dispatch
                </h2>
              </div>
              <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                {readyOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {readyOrders.map((order) => (
                <KanbanCard
                  key={order._id}
                  order={order}
                  actionLabel="Assign Rider"
                  actionTargetStatus="ASSIGNED"
                  onAction={() => window.location.assign(`/admin/orders/in-transit`)}
                  isLoading={actionInProgress === order.orderNumber}
                />
              ))}
              {readyOrders.length === 0 && (
                <div className="text-center py-12 text-xs font-bold text-emerald-400">
                  No orders ready for dispatch
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KanbanCard({
  order,
  actionLabel,
  actionTargetStatus,
  onAction,
  isLoading,
}: {
  order: LiveOrder;
  actionLabel: string;
  actionTargetStatus: string;
  onAction: () => void;
  isLoading: boolean;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer calculated from createdAt
  useEffect(() => {
    const start = new Date(order.createdAt).getTime();
    const update = () => {
      const now = new Date().getTime();
      setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // SLA Color: 0-2:59 Green, 3:00-4:59 Yellow, 5:00+ Red
  const slaColor =
    minutes < 3
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : minutes < 5
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-red-100 text-red-800 border-red-200 animate-pulse";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <Link
          href={`/admin/orders/${order.orderNumber}`}
          className="text-xs font-black text-[var(--primary)] hover:underline flex items-center gap-1"
        >
          #{order.orderNumber}
          <ChevronRight size={13} />
        </Link>
        <div className={`px-2 py-0.5 rounded-lg border text-[11px] font-black flex items-center gap-1 ${slaColor}`}>
          <Clock size={12} />
          {timeFormatted}
        </div>
      </div>

      <div className="text-[11px] text-[var(--text-secondary)] mb-3 flex items-center justify-between">
        <span>Items: {order.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
        <span className="font-bold text-[var(--text-primary)]">{formatPrice(order.grandTotal)}</span>
      </div>

      {/* Items list preview */}
      <div className="space-y-1.5 border-t border-b border-slate-100 py-2.5 my-2 max-h-32 overflow-y-auto">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs font-medium">
            <span className="truncate max-w-[180px] text-slate-700">
              <strong className="text-slate-900">{item.quantity}x</strong> {item.name}
            </span>
            <span className="text-slate-500">{formatPrice(item.sellingPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-slate-400">
          Pay: {order.paymentMethod} ({order.paymentStatus})
        </span>

        <button
          type="button"
          onClick={onAction}
          disabled={isLoading}
          className="h-9 px-3 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:brightness-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          <Check size={14} />
          {isLoading ? "Updating..." : actionLabel}
        </button>
      </div>
    </div>
  );
}
