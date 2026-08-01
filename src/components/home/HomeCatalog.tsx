"use client";

import { LayoutGrid } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import Container from "@/components/ui/Container";
import ProductCard from "@/components/product/ProductCard";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminProducts } from "@/hooks/useAdminProducts";

const productGroups = [
  { id: "bestsellers", title: "Bestsellers", subtitle: "Most loved items", slugs: [], icon: "⭐" },
  { id: "fresh", title: "Vegetables & Fruits", subtitle: "Fresh every day", slugs: ["fruits-vegetables"], icon: "🥬" },
  { id: "grocery", title: "Grocery & Kitchen", subtitle: "Daily essentials", slugs: ["atta-rice-dal", "dairy-breakfast"], icon: "🌾" },
  { id: "snacks", title: "Snacks & Drinks", subtitle: "Quick bites & beverages", slugs: ["snacks-munchies", "cold-drinks-juices"], icon: "🥨" },
  { id: "beauty", title: "Beauty & Care", subtitle: "Personal & home care", slugs: ["personal-care", "home-care", "baby-care"], icon: "🧴" },
  { id: "more", title: "More essentials", subtitle: "Frozen, pet & stationery", slugs: ["frozen-food", "pet-care", "stationery", "bakery-biscuits"], icon: "✨" },
];

export default function HomeCatalog() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { activeCategories: categories, hydrated: categoriesHydrated } = useAdminCategories();
  const { activeProducts, hydrated: productsHydrated } = useAdminProducts();
  const activeGroup = productGroups.find((group) => selectedCategory === `group:${group.id}`);
  const products = useMemo(() => {
    if (selectedCategory === "all") return activeProducts;
    if (activeGroup) return activeGroup.id === "bestsellers" ? activeProducts.filter((product) => product.bestseller) : activeProducts.filter((product) => activeGroup.slugs.includes(product.categorySlug));
    return activeProducts.filter((product) => product.categorySlug === selectedCategory);
  }, [activeGroup, activeProducts, selectedCategory]);
  const activeCategory = categories.find((category) => category.slug === selectedCategory);

  if (!categoriesHydrated || !productsHydrated) return null;

  return <section className="pb-7 pt-4 sm:pb-9"><Container>
    <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-3 sm:mx-0 sm:px-0">
      <CategoryChip active={selectedCategory === "all"} icon={<LayoutGrid size={20} />} label="All" onClick={() => setSelectedCategory("all")} />
      {categories.map((category) => <CategoryChip key={category.id} active={selectedCategory === category.slug} icon={<span className="text-xl">{category.icon}</span>} label={category.name} onClick={() => setSelectedCategory(category.slug)} />)}
    </div>

    {selectedCategory === "all" && <><div className="mt-4 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.13em] text-[var(--primary)]">Shop by group</p><h2 className="mt-1 text-xl font-black tracking-[-.04em]">Popular collections</h2></div></div><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{productGroups.map((group) => { const thumbs = group.id === "bestsellers" ? activeProducts.filter((product) => product.bestseller).slice(0, 4) : activeProducts.filter((product) => group.slugs.includes(product.categorySlug)).slice(0, 4); return <button key={group.id} type="button" onClick={() => setSelectedCategory(`group:${group.id}`)} className="rounded-2xl border border-[var(--border)] bg-white p-3 text-left shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"><div className="grid grid-cols-2 gap-1.5">{Array.from({ length: 4 }).map((_, index) => <span key={index} className="flex aspect-square items-center justify-center rounded-lg bg-[var(--surface-soft)] text-lg">{thumbs[index]?.fallbackIcon ?? group.icon}</span>)}</div><p className="mt-2 line-clamp-1 text-xs font-black">{group.title}</p><p className="mt-0.5 line-clamp-1 text-[9px] text-[var(--text-muted)]">{group.subtitle}</p></button>;})}</div></>}

    <div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.13em] text-[var(--primary)]">Browse products</p><h2 className="mt-1 text-xl font-black tracking-[-.04em] text-[var(--text-primary)]">{activeGroup?.title ?? activeCategory?.name ?? "All items"}</h2></div><span className="text-xs font-bold text-[var(--text-muted)]">{products.length} items</span></div>
    {products.length ? <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-4 rounded-3xl bg-[var(--surface-soft)] p-10 text-center text-sm font-bold text-[var(--text-muted)]">No items in this group yet.</div>}
  </Container></section>;
}

function CategoryChip({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex w-[74px] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center transition ${active ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]" : "bg-white text-[var(--text-primary)] shadow-[var(--shadow-xs)]"}`}><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-white/15" : "bg-[var(--surface-soft)] text-[var(--primary)]"}`}>{icon}</span><span className="line-clamp-1 w-full text-[10px] font-black">{label}</span></button>;
}
