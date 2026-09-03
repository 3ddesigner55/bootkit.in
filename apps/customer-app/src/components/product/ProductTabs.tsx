"use client";
import type { Product } from "@/types/product";
import { useState } from "react";
import {
  FileText,
  Info,
  Truck,
  ShieldCheck,
} from "lucide-react";

type ProductTabsProps = {
  product: Product;
};
const tabs = [
  {
    id: "description",
    label: "Description",
    icon: FileText,
  },
  {
    id: "specifications",
    label: "Specifications",
    icon: Info,
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: Truck,
  },
];

export default function ProductTabs({
  product,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] =
    useState("description");

  return (
    <section className="rounded-[26px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      {/* Tabs */}

      <div className="flex overflow-x-auto border-b border-[var(--border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`flex min-w-[150px] items-center justify-center gap-2 border-b-2 px-5 py-4 text-sm font-black transition ${
                activeTab === tab.id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)]"
              }`}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6">

        {activeTab === "description" && (
          <div className="space-y-4">
            <h3 className="text-xl font-black">
              Product Description
            </h3>

            <p className="leading-7 text-[var(--text-secondary)]">
              Premium quality product carefully selected for everyday use. Fresh inventory, quality checked, and delivered quickly to your doorstep.
            </p>
          </div>
        )}

        {activeTab === "specifications" && (
          <div className="grid gap-4 sm:grid-cols-2">

            <SpecItem
              title="Brand"
              value={product.brand}
            />

            <SpecItem
              title="Category"
              value={product.categorySlug}
            />

            <SpecItem
              title="Pack Size"
              value={product.unit.label}
            />

            <SpecItem
              title="Country"
              value="India"
            />

            <SpecItem
              title="Quality"
              value="Premium"
            />

            <SpecItem
              title="Shelf Life"
              value="Refer product label"
            />

          </div>
        )}

        {activeTab === "delivery" && (
          <div className="space-y-5">

            <DeliveryRow
              title="Fast Delivery"
              description="Usually delivered within your selected delivery slot."
            />

            <DeliveryRow
              title="Quality Assurance"
              description="Products are quality checked before dispatch."
            />

            <DeliveryRow
              title="Return Policy"
              description="Damaged or incorrect items are eligible for support."
            />

          </div>
        )}

      </div>
    </section>
  );
}

function SpecItem({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <p className="text-xs text-[var(--text-muted)]">
        {title}
      </p>

      <p className="mt-1 font-black">
        {value}
      </p>
    </div>
  );
}

function DeliveryRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">

      <span className="mt-1 rounded-xl bg-[var(--primary-light)] p-2 text-[var(--primary)]">
        <ShieldCheck size={18} />
      </span>

      <div>
        <h4 className="font-black">
          {title}
        </h4>

        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>

    </div>
  );
}