"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Search,
  Share2,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getProduct } from "@/services/product.service";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useLocation } from "@/hooks/useLocation";
import { formatPrice, percentageOff } from "@/lib/utils";
import type { ProductVariant } from "@/types/product";
import QuantitySelector from "@/components/ui/QuantitySelector";

import ProductImageGallery from "./ProductImageGallery";
import ProductInfoCards from "./ProductInfoCards";
import ProductUnitSelector from "./ProductUnitSelector";
import SimilarProducts from "./SimilarProducts";

export default function ProductDetails() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = decodeURIComponent(params.slug);
  const { resolvedStoreId } = useLocation();

  const [product, setProduct] = useState<any | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { hydrated: cartHydrated, getQuantity, addItem, increaseItem, decreaseItem } =
    useCart();
  const { hydrated: wishlistHydrated, isWishlisted, toggleWishlist } = useWishlist();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>();

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);

    void getProduct(slug, resolvedStoreId || undefined)
      .then((res) => {
        if (!cancelled) {
          setProduct(res.product);
          setRelatedProducts(res.relatedProducts || []);
        }
      })
      .catch((err) => {
        console.error("Error fetching product details:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, resolvedStoreId]);

  useEffect(() => {
    setSelectedVariant(undefined);
  }, [product?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-16 animate-pulse border-b border-[#EEF2EF] bg-white" />
        <div className="mx-auto max-w-2xl animate-pulse">
          <div className="aspect-square bg-[#F6F8F6]" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-1/3 rounded bg-[#EEF2EF]" />
            <div className="h-8 w-4/5 rounded bg-[#EEF2EF]" />
            <div className="h-16 rounded-2xl bg-[#EEF2EF]" />
          </div>
        </div>
      </div>
    );
  }


  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <header className="flex h-16 items-center border-b border-[#EEF2EF] px-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F6F8F6]"
          >
            <ArrowLeft size={20} />
          </button>
        </header>
        <section className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3F7F4] text-[var(--text-muted)]">
            <ShoppingBag size={28} />
          </span>
          <h1 className="mt-5 text-xl font-black text-[var(--text-primary)]">
            Product not found
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            This product may have been removed or is unavailable.
          </p>
          <Link
            href="/products"
            className="mt-6 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-black text-white"
          >
            Browse products
          </Link>
        </section>
      </div>
    );
  }

  const selectedPrice = selectedVariant?.price ?? product.price;
  const selectedMrp = selectedVariant?.mrp ?? product.mrp;
  const selectedStock = selectedVariant?.stock ?? product.stock;
  const quantity = cartHydrated
    ? getQuantity(product.id, selectedVariant?.id)
    : 0;
  const discount = percentageOff(selectedMrp, selectedPrice);
  const hasTags = (product.tags?.length ?? 0) > 0;

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: product.name, url });
        return;
      }

      await navigator.clipboard.writeText(url);
    } catch {
      // Dismissed native share sheets and clipboard failures do not affect the page.
    }
  };

  return (
    <div className="min-h-screen bg-white pb-28">
      <header className="sticky top-0 z-40 border-b border-[#EEF2EF] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[#F4F7F4]"
          >
            <ArrowLeft size={21} />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label="Toggle wishlist"
              aria-pressed={wishlistHydrated && isWishlisted(product.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[#F4F7F4]"
            >
              <Heart
                size={20}
                className={
                  wishlistHydrated && isWishlisted(product.id)
                    ? "fill-red-500 text-red-500"
                    : ""
                }
              />
            </button>
            <button
              type="button"
              onClick={() => router.push("/search")}
              aria-label="Search products"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[#F4F7F4]"
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share product"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[#F4F7F4]"
            >
              <Share2 size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl">
        <ProductImageGallery product={product} selectedVariant={selectedVariant} />

        <div className="space-y-5 px-4 pb-6">
          {hasTags ? (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {product.tags?.map((tag: string) => (
                <span
                  key={tag}
                  className="shrink-0 rounded-full bg-[#EFF8F1] px-3 py-1.5 text-[11px] font-black text-[var(--primary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 rounded-full bg-[#F1F8F3] px-2.5 py-1.5 text-[var(--primary)]">
              <Truck size={14} />
              {product.deliveryMinutes} min
            </span>
            <span className="flex items-center gap-1.5">
              <Star size={15} fill="currentColor" className="text-[#F6B500]" />
              {product.rating}
              <span className="text-[var(--text-muted)]">({product.reviewCount})</span>
            </span>
          </div>

          <section>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">
              {product.brand}
            </p>
            <h1 className="mt-1.5 text-2xl font-black leading-tight tracking-[-0.035em] text-[var(--text-primary)] sm:text-3xl">
              {product.name}
            </h1>
            {product.description ? (
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {product.description}
              </p>
            ) : null}
          </section>

          <ProductUnitSelector product={product} onChange={setSelectedVariant} />

          <section className="rounded-2xl border border-[#EEF2EF] bg-white p-4 shadow-[0_4px_16px_rgba(25,50,34,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ECF8EF] text-lg font-black text-[var(--primary)]">
                  {product.brand.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[var(--text-muted)]">Brand</p>
                  <p className="truncate text-sm font-black text-[var(--text-primary)]">
                    {product.brand}
                  </p>
                </div>
              </div>
              <Link
                href={`/brand/${product.brand.toLowerCase().replace(/\s+/g, "-")}`}
                className="shrink-0 text-xs font-black text-[var(--primary)]"
              >
                Explore all
              </Link>
            </div>
          </section>

          <ProductInfoCards product={product} deliveryMinutes={product.deliveryMinutes} />
        </div>

        <SimilarProducts
          categorySlug={product.categorySlug}
          products={relatedProducts}
        />
      </main>

      <footer className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-[#EEF2EF] bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1 pl-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {selectedVariant?.unit.label ?? product.unit.label}
            </p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-lg font-black text-[var(--text-primary)]">
                {formatPrice(selectedPrice)}
              </span>
              {selectedMrp > selectedPrice ? (
                <span className="text-[11px] font-semibold text-[var(--text-muted)] line-through">
                  {formatPrice(selectedMrp)}
                </span>
              ) : null}
              {discount > 0 ? (
                <span className="text-[10px] font-black text-[var(--success)]">
                  {discount}% off
                </span>
              ) : null}
            </div>
          </div>

          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => addItem(product, selectedVariant)}
              disabled={!cartHydrated || selectedStock <= 0}
              className="flex h-12 min-w-[146px] items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[0_8px_18px_rgba(44,143,70,0.2)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedStock > 0 ? "Add to cart" : "Out of stock"}
            </button>
          ) : (
            <QuantitySelector
              quantity={quantity}
              max={selectedStock}
              onIncrease={() => increaseItem(product.id, selectedVariant?.id)}
              onDecrease={() => decreaseItem(product.id, selectedVariant?.id)}
              className="h-12 min-w-[146px] justify-between rounded-xl"
            />
          )}
        </div>
      </footer>
    </div>
  );
}
