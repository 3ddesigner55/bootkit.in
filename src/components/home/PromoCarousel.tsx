"use client";

import Link from "next/link";
import { ChevronRight, Sparkles, Truck } from "lucide-react";
import { useEffect, useState } from "react";

const promos = [
  { title: "Flat ₹50 OFF", detail: "On your first order above ₹249", icon: Sparkles, tone: "bg-[#ffe49a] text-[#5d4200]" },
  { title: "Fast local delivery", detail: "Fresh essentials at your doorstep", icon: Truck, tone: "bg-[var(--primary-light)] text-[var(--primary)]" },
];

export default function PromoCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setActive((current) => (current + 1) % promos.length), 4000); return () => window.clearInterval(timer); }, []);
  const promo = promos[active]; const Icon = promo.icon;
  return <section className="py-3"><div className="site-container"><Link href="/offers" className={`flex items-center gap-3 rounded-2xl p-4 transition ${promo.tone}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/65"><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block text-sm">{promo.title}</span><span className="mt-0.5 block text-[11px] opacity-75">{promo.detail}</span></span><ChevronRight size={18} /></Link><div className="mt-2 flex justify-center gap-1.5">{promos.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index === active ? "w-4 bg-[var(--primary)]" : "w-1.5 bg-[var(--border-strong)]"}`} />)}</div></div></section>;
}
