"use client";
import type { Product } from "@/types/product";
import ProductBottomSheet from "@/components/product/ProductBottomSheet";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import { X } from "lucide-react";
import { useState } from "react";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { formatPrice } from "@/lib/utils";

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  initialCategorySlug?: string;
}

export default function CategoryDrawer({
  open,
  onClose,
  title = "Categories",
  initialCategorySlug,
}: CategoryDrawerProps) {

const {
  hydrated,
  getQuantity,
  addItem,
  increaseItem,
  decreaseItem,
} = useCart();

const { activeProducts } = useAdminProducts();
const { activeCategories } = useAdminCategories();

const [selectedCategory, setSelectedCategory] = useState("");
const [productOpen, setProductOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

const currentCategory =
  selectedCategory ||
  initialCategorySlug ||
  activeCategories[0]?.slug ||
  "";

const products = activeProducts.filter(
  (product) => product.categorySlug === currentCategory

  
);



  if (!open) return null;

  return (
    <>
      {/* Overlay */}

      <div
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
      />

      {/* Drawer */}

      <div className="fixed inset-x-0 bottom-0 z-[100] h-[88vh] rounded-t-[32px] bg-white shadow-2xl">

        {/* Handle */}

        <div className="flex justify-center pt-3">

          <div className="h-1.5 w-14 rounded-full bg-gray-300" />

        </div>

        {/* Header */}

        <div className="flex items-center justify-between px-5 py-4">
            <div>

<h2 className="text-xl font-black">
  {title}
</h2>

<p className="text-xs text-gray-500">
  250+ Products Available
</p>

</div>

          

          <button
            onClick={onClose}
            className="rounded-xl bg-gray-100 p-2"
          >
            <X size={20} />
          </button>

        </div>

        {/* Body */}

        <div className="grid h-[calc(88vh-80px)] grid-cols-[95px_1fr]">

          {/* Sidebar */}

          <div className="overflow-y-auto bg-[#F6F8F6]">

            {activeCategories.map((category) => (

  <button
    key={category.id}
    onClick={() => setSelectedCategory(category.slug)}
    className={`w-full px-2 py-4 transition ${
      currentCategory === category.slug
        ? "bg-white text-[var(--primary)]"
        : "bg-[#F6F8F6] text-gray-500"
    }`}
  >

    <div className="text-2xl">
      {category.icon}
    </div>

    <p className="mt-2 text-[11px] font-bold leading-4">
      {category.name}
    </p>

  </button>

))}

          </div>

          {/* Products */}

          <div className="overflow-y-auto p-4">

            <div className="grid grid-cols-2 gap-4">

              {products.map((product) => (

 <div
  key={product.id}
  onClick={() => {
  setSelectedProduct(product);
  setProductOpen(true);
}}
  className="cursor-pointer rounded-2xl border border-[#edf1ee] bg-white p-3 transition hover:shadow-md"
>

    <div className="flex h-24 items-center justify-center rounded-xl bg-[#f7f8fa]">

  {product.image ? (

    <Image
      src={product.image}
      alt={product.name}
      width={72}
      height={72}
      className="object-contain"
    />

  ) : (

    <span className="text-5xl">
      {product.fallbackIcon ?? "📦"}
    </span>

  )}

</div>
    <h3 className="mt-3 line-clamp-2 text-sm font-bold">
      {product.name}
    </h3>

    <p className="mt-1 text-sm font-black text-[var(--primary)]">
      {formatPrice(product.price)}
    </p>

    <p className="mt-1 text-[11px] text-gray-500">
      {product.unit.label}
    </p>

    {hydrated && getQuantity(product.id) === 0 ? (

  <button
    onClick={() => addItem(product)}
    className="mt-3 w-full rounded-xl bg-[var(--primary)] py-2 text-sm font-bold text-white transition hover:bg-green-700"
  >
    ADD
  </button>

) : (

  <QuantitySelector
    className="mt-3 w-full justify-center"
    quantity={getQuantity(product.id)}
    max={product.stock}
    onIncrease={() => increaseItem(product.id)}
    onDecrease={() => decreaseItem(product.id)}
  />

  
)}

  </div>

))}

{products.length === 0 && (

  <div className="col-span-2 py-10 text-center text-sm text-gray-500">

    No products available

  </div>

)}

            </div>

          </div>

        </div>

      </div>
      <ProductBottomSheet
  open={productOpen}
  product={selectedProduct}
  onClose={() => {
    setProductOpen(false);
    setSelectedProduct(null);
  }}
/>
    </>
  );
}