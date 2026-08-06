"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { getStoredOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { BootkitOrder } from "@/types/order";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
export default function ReportsPage() { const [orders, setOrders] = useState<BootkitOrder[]>([]); useEffect(() => setOrders(getStoredOrders()), []); const stats = useMemo(() => ({ revenue: orders.filter((o) => o.status !== "Cancelled").reduce((sum, o) => sum + o.totalAmount, 0), delivered: orders.filter((o) => o.status === "Delivered").length, average: orders.length ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length : 0 }), [orders]); return <div className="min-h-screen bg-[var(--background)]"><Header /><Container className="py-6"><AdminPageHeader title="Sales reports" description="इस device के local order data पर आधारित" /><section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Total orders", String(orders.length)], ["Revenue", formatPrice(stats.revenue)], ["Delivered", String(stats.delivered)], ["Average order", formatPrice(stats.average)]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-sm)]"><p className="text-xs text-[var(--text-muted)]">{label}</p><p className="mt-2 text-xl font-black">{value}</p></div>)}</section><section className="mt-6 rounded-2xl bg-white p-5"><h2 className="font-black">Export</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Excel और PDF export next step में इसी report data से generate होंगे।</p></section></Container></div>; }
