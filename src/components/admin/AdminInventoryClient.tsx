"use client";

import { AlertTriangle, Boxes, PackageCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { useAccount } from "@/hooks/useAccount";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { getAdminStores } from "@/services/adminStores.service";
import type { AdminStoreData } from "@/services/adminStores.service";
import {
  getAdminStoreInventories,
  updateAdminStoreInventory,
  type AdminStoreInventoryItem,
} from "@/services/adminStoreInventory.service";
import { formatPrice } from "@/lib/utils";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminLoadingSkeleton from "@/components/admin/ui/AdminLoadingSkeleton";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminPrimaryButton from "@/components/admin/ui/AdminPrimaryButton";

const LOW_STOCK_LIMIT = 10;

export default function AdminInventoryClient() {
  const { session } = useAccount();
  const accessToken = session?.accessToken || "";
  const { products, hydrated: productsHydrated, updateProduct } = useAdminProducts();

  const [stores, setStores] = useState<AdminStoreData[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [storeInventories, setStoreInventories] = useState<AdminStoreInventoryItem[]>([]);
  const [inventoryHydrated, setInventoryHydrated] = useState(false);
  const [stockChanges, setStockChanges] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await getAdminStores(accessToken, { limit: 100 });
      setStores(response.stores);
      if (response.stores.length > 0 && !selectedStoreId) {
        setSelectedStoreId(response.stores[0].id);
      }
    } catch {
      setStores([]);
    }
  }, [accessToken, selectedStoreId]);

  const loadStoreInventories = useCallback(async () => {
    if (!accessToken || !selectedStoreId) {
      setInventoryHydrated(true);
      return;
    }
    try {
      const response = await getAdminStoreInventories(accessToken, {
        storeId: selectedStoreId,
        limit: 100,
      });
      setStoreInventories(response.items);
    } catch {
      setStoreInventories([]);
    } finally {
      setInventoryHydrated(true);
    }
  }, [accessToken, selectedStoreId]);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    if (selectedStoreId) {
      void loadStoreInventories();
    } else {
      setInventoryHydrated(true);
    }
  }, [selectedStoreId, loadStoreInventories]);

  const hasStoreInventory = storeInventories.length > 0;

  const lowStock = useMemo(() => {
    if (hasStoreInventory) {
      return storeInventories
        .filter((item) => item.stock <= LOW_STOCK_LIMIT)
        .sort((a, b) => a.stock - b.stock);
    }
    return products
      .filter((product) => product.stock <= LOW_STOCK_LIMIT)
      .sort((a, b) => a.stock - b.stock);
  }, [hasStoreInventory, storeInventories, products]);

  const inventoryValue = useMemo(() => {
    if (hasStoreInventory) {
      return storeInventories.reduce(
        (sum, item) => sum + item.stock * item.sellingPrice,
        0
      );
    }
    return products.reduce(
      (sum, product) => sum + product.stock * product.price,
      0
    );
  }, [hasStoreInventory, storeInventories, products]);

  const totalItemsCount = hasStoreInventory
    ? storeInventories.length
    : products.length;

  const saveStock = async (id: string, isStoreInvItem: boolean) => {
    const rawVal = stockChanges[id];
    const stock = Number(rawVal);
    if (!Number.isInteger(stock) || stock < 0) return;

    setSavingId(id);
    try {
      if (isStoreInvItem && accessToken) {
        await updateAdminStoreInventory(accessToken, id, { stock });
        await loadStoreInventories();
      } else {
        updateProduct(id, { stock });
      }
      setStockChanges((current) => ({ ...current, [id]: "" }));
    } finally {
      setSavingId(null);
    }
  };

  if (!productsHydrated && !inventoryHydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <Container className="py-8">
          <AdminLoadingSkeleton variant="page" />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main>
        <Container className="py-5 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <AdminPageHeader
              title="Inventory & low stock"
              description="Stock levels को देखिए और तुरंत update कीजिए"
            />

            {stores.length > 0 && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-[var(--text-muted)]">
                  Store:
                </span>
                <select
                  value={selectedStoreId}
                  onChange={(event) => setSelectedStoreId(event.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-bold shadow-sm outline-none focus:border-[var(--primary)]"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.city})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat
              icon={<Boxes size={20} />}
              label="Inventory value"
              value={formatPrice(inventoryValue)}
            />
            <Stat
              icon={<AlertTriangle size={20} />}
              label="Low stock items"
              value={String(lowStock.length)}
            />
            <Stat
              icon={<PackageCheck size={20} />}
              label="Total items"
              value={String(totalItemsCount)}
            />
          </section>

          <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-black">Low-stock alerts</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                10 units या कम stock वाले products
              </p>
            </div>

            {lowStock.length ? (
              <div className="divide-y divide-[var(--border)]">
                {lowStock.map((item) => {
                  const isStoreInv = "productName" in item;
                  const id = isStoreInv
                    ? (item as AdminStoreInventoryItem).id
                    : (item as { id: string }).id;
                  const name = isStoreInv
                    ? (item as AdminStoreInventoryItem).productName
                    : (item as { name: string }).name;
                  const unitLabel = isStoreInv
                    ? (item as AdminStoreInventoryItem).productUnitLabel
                    : (item as { unit: { label: string } }).unit.label;
                  const currentStock = item.stock;
                  const icon = isStoreInv
                    ? (item as AdminStoreInventoryItem).productFallbackIcon || "📦"
                    : (item as { fallbackIcon?: string }).fallbackIcon || "📦";

                  return (
                    <div
                      key={id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-2xl">
                        {icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-black">{name}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {unitLabel} · {currentStock} units left
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          value={stockChanges[id] ?? ""}
                          onChange={(event) =>
                            setStockChanges((current) => ({
                              ...current,
                              [id]: event.target.value.replace(/\D/g, ""),
                            }))
                          }
                          placeholder="New stock"
                          inputMode="numeric"
                          className="h-10 w-24 rounded-lg border border-[var(--border)] px-3 text-xs"
                        />
                        <AdminPrimaryButton
                          type="button"
                          disabled={savingId === id}
                          onClick={() => saveStock(id, isStoreInv)}
                          className="rounded-lg px-3"
                        >
                          {savingId === id ? "Saving..." : "Update"}
                        </AdminPrimaryButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <AdminEmptyState
                title="All products have healthy stock."
                description="No products currently need a stock update."
                className="min-h-[220px] border-0"
              />
            )}
          </section>
        </Container>
      </main>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <span className="text-[var(--primary)]">{icon}</span>
      <p className="mt-3 text-xl font-black">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
