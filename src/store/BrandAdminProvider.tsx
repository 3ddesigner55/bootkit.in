"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { brands as defaultBrands } from "@/data/brands";
import type { Brand } from "@/types/brand";

type BrandInput = Omit<Brand, "id"> & { id?: string };
type BrandContextValue = {
  brands: Brand[];
  activeBrands: Brand[];
  hydrated: boolean;
  addBrand: (brand: BrandInput) => Brand;
  updateBrand: (id: string, updates: Partial<Brand>) => Brand | null;
  removeBrand: (id: string) => void;
  toggleBrand: (id: string) => void;
  resetBrands: () => void;
};

export const BrandAdminContext = createContext<BrandContextValue | null>(null);
const STORAGE_KEY = "bootkit_admin_brands_v1";
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "brand";
const newId = () => `brand_${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}`;

function validBrand(value: unknown): value is Brand {
  if (!value || typeof value !== "object") return false;
  const brand = value as Partial<Brand>;
  return typeof brand.id === "string" && typeof brand.name === "string" && typeof brand.slug === "string" && typeof brand.logo === "string" && typeof brand.description === "string" && typeof brand.active === "boolean";
}

function sanitize(brand: Brand): Brand {
  return { ...brand, name: brand.name.trim(), slug: slugify(brand.slug || brand.name), logo: brand.logo.trim() || "🏷️", description: brand.description.trim() };
}

export default function BrandAdminProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      setBrands(Array.isArray(stored) && stored.filter(validBrand).length ? stored.filter(validBrand) : defaultBrands);
    } catch { setBrands(defaultBrands); }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(brands)); }, [brands, hydrated]);

  const uniqueSlug = useCallback((requested: string, list: Brand[], ignore?: string) => {
    const base = slugify(requested); let slug = base; let counter = 2;
    while (list.some((brand) => brand.slug === slug && brand.id !== ignore)) slug = `${base}-${counter++}`;
    return slug;
  }, []);
  const addBrand = useCallback((input: BrandInput) => {
    let created: Brand | null = null;
    setBrands((current) => { created = sanitize({ ...input, id: input.id?.trim() || newId(), slug: uniqueSlug(input.slug || input.name, current) } as Brand); return [created, ...current]; });
    if (!created) throw new Error("Brand could not be created."); return created;
  }, [uniqueSlug]);
  const updateBrand = useCallback((id: string, updates: Partial<Brand>) => {
    let updated: Brand | null = null;
    setBrands((current) => current.map((brand) => { if (brand.id !== id) return brand; updated = sanitize({ ...brand, ...updates, id: brand.id, slug: uniqueSlug(updates.slug || updates.name || brand.slug, current, id) }); return updated; }));
    return updated;
  }, [uniqueSlug]);
  const value = useMemo(() => ({ brands, activeBrands: brands.filter((brand) => brand.active), hydrated, addBrand, updateBrand, removeBrand: (id: string) => setBrands((current) => current.filter((brand) => brand.id !== id)), toggleBrand: (id: string) => setBrands((current) => current.map((brand) => brand.id === id ? { ...brand, active: !brand.active } : brand)), resetBrands: () => setBrands(defaultBrands) }), [brands, hydrated, addBrand, updateBrand]);
  return <BrandAdminContext.Provider value={value}>{children}</BrandAdminContext.Provider>;
}
