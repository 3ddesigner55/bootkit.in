"use client";

import ProductRatingSummary from "@/components/product/ProductRatingSummary";
import ProductQuestions from "@/components/product/ProductQuestions";
import ProductDeliveryInfo from "@/components/product/ProductDeliveryInfo";
import ProductHighlights from "./ProductHighlights";
import ProductSeller from "./ProductSeller";
import ProductOffers from "./ProductOffers";
import ProductVariantSelector from "@/components/product/ProductVariantSelector";
import ProductStock from "@/components/product/ProductStock";
import ProductShare from "@/components/product/ProductShare";
import FrequentlyBoughtTogether from "@/components/product/recommendations/FrequentlyBoughtTogether";
import ProductReviews from "@/components/product/reviews/ProductReviews";
import ProductTabs from "@/components/product/ProductTabs";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import ProductGallery from "@/components/product/ProductGallery";
import RecentlyViewed from "@/components/product/recommendations/RecentlyViewed";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  MapPin,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import ProductCard from "@/components/product/ProductCard";
import Container from "@/components/ui/Container";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { useCart } from "@/hooks/useCart";
import { useLocation } from "@/hooks/useLocation";
import { formatPrice, percentageOff } from "@/lib/utils";
import type { ProductVariant } from "@/types/product";

export default function ProductDetails() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const slug = decodeURIComponent(params.slug);

const {
  activeProducts,
  hydrated: productsHydrated,
  getProductBySlug,
} = useAdminProducts();

const product = getProductBySlug(slug);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);


  const {
    hydrated: cartHydrated,
    getQuantity,
    addItem,
    increaseItem,
    decreaseItem,
  } = useCart();

  const {
    location,
    hydrated: locationHydrated,
    openLocationModal,
  } = useLocation();

  

  const {
  addRecentlyViewed,
} = useRecentlyViewed();



const relatedProducts = useMemo(() => {
  if (!product) return [];

  return activeProducts
    .filter(
      (item) =>
        item.id !== product.id &&
        item.categorySlug === product.categorySlug
    )
    .slice(0, 6);
}, [activeProducts, product]);

useEffect(() => {
  if (!product) return;

  addRecentlyViewed(product);
}, [product, addRecentlyViewed]);

if (!productsHydrated) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <Container className="py-4 sm:py-8">
        <div className="grid overflow-hidden rounded-[26px] border border-[var(--border)] bg-white lg:grid-cols-2">
          <div className="aspect-square animate-pulse bg-[var(--surface-soft)]" />

          <div className="space-y-4 p-5 sm:p-8">
            <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-soft)]" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-[var(--surface-soft)]" />
            <div className="h-6 w-40 animate-pulse rounded bg-[var(--surface-soft)]" />
            <div className="h-20 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
          </div>
        </div>
      </Container>
    </div>
  );
}

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />

        <Container className="py-8">
          <section className="flex min-h-[460px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center shadow-[var(--shadow-sm)]">
            <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--surface-soft)] text-[var(--text-muted)]">
              <ShoppingBag size={34} />
            </span>

            <h1 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
              Product not found
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
              This product may have been removed or is currently unavailable.
            </p>

            <Link
              href="/products"
              className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-6 text-sm font-black text-white"
            >
              Browse products
            </Link>

            
          </section>
          
        </Container>
      </div>
    );
  }

  const selectedPrice = selectedVariant?.price ?? product.price;
  const selectedMrp = selectedVariant?.mrp ?? product.mrp;
  const selectedStock = selectedVariant?.stock ?? product.stock;
  const quantity = cartHydrated ? getQuantity(product.id, selectedVariant?.id) : 0;
  const discount = percentageOff(selectedMrp, selectedPrice);
  const saving = Math.max(selectedMrp - selectedPrice, 0);

  const buyNow = () => {
    if (quantity === 0) {
      addItem(product, selectedVariant);
    }

    router.push("/cart");
  };
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 hidden items-center gap-1.5 overflow-hidden text-[11px] font-semibold text-[var(--text-muted)] sm:flex"
          >
            <Link href="/" className="hover:text-[var(--primary)]">
              Home
            </Link>

            <ChevronRight size={13} />

            <Link
              href="/products"
              className="hover:text-[var(--primary)]"
            >
              Products
            </Link>

            <ChevronRight size={13} />

            <span className="truncate text-[var(--text-primary)]">
              {product.name}
            </span>
          </nav>

          

          <section className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div className="border-b border-[var(--border)] p-4 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
                <ProductGallery product={product} selectedVariant={selectedVariant} />

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <ProductBenefit
                    icon={ShieldCheck}
                    title="Quality checked"
                  />

                  <ProductBenefit
                    icon={Clock3}
                    title={`${product.deliveryMinutes} min`}
                  />

                  <ProductBenefit
                    icon={RotateCcw}
                    title="Easy support"
                  />
                </div>

<div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
  <div className="flex flex-wrap gap-2">
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
      ❄️ Chilled
    </span>

    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
      🍋 Flavour
    </span>

    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
      📅 120 Days
    </span>
  </div>
</div>


              </div>

              <div className="p-4 sm:p-6 lg:p-8">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--primary)]">
                  {product.brand}
                </p>

                <h1 className="mt-2 text-[28px] font-black leading-tight tracking-[-0.045em] text-[var(--text-primary)] sm:text-[38px]">
                  {product.name}
                </h1>

                <div className="mt-3 flex items-center justify-between">
  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
    <Clock3 size={16} className="text-green-600" />
    <span>{product.deliveryMinutes} mins</span>
  </div>

  <div className="flex items-center gap-1 text-sm font-semibold">
    <Star size={16} fill="currentColor" className="text-yellow-500" />
    <span>{product.rating}</span>
  </div>
</div>

                <div className="mt-6 flex items-end gap-3">
                  <span className="text-[30px] font-black tracking-[-0.04em] text-[var(--text-primary)]">
                    {formatPrice(selectedPrice)}
                  </span>

                  {selectedMrp > selectedPrice && (
                    <span className="pb-1 text-sm font-semibold text-[var(--text-muted)] line-through">
                      {formatPrice(selectedMrp)}
                    </span>
                  )}

                  {discount > 0 && (
                    <span className="mb-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-black text-[var(--success)]">
                      {discount}% OFF
                    </span>
                  )}
                </div>

                {saving > 0 && (
                  <p className="mt-2 text-xs font-bold text-[var(--success)]">
                    You save {formatPrice(saving)} on this item
                  </p>
                )}

                <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Pack size
                  </p>

                  <button
                    type="button"
                    className="mt-2 rounded-xl border border-[var(--primary)] bg-white px-4 py-3 text-sm font-black text-[var(--primary)]"
                  >
                    {selectedVariant?.unit.label ?? product.unit.label}
                  </button>
                </div>

                
<section className="py-6">
  <ProductHighlights />
</section>

<ProductStock product={product} stock={selectedStock} label={selectedVariant?.unit.label ?? product.unit.label} />
<ProductVariantSelector product={product} onChange={setSelectedVariant} />
<ProductOffers />
<div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-500">Brand</p>

      <h3 className="mt-1 text-base font-bold">
        {product.brand}
      </h3>
    </div>

    <Link
      href={`/brand/${product.brand.toLowerCase().replace(/\s+/g, "-")}`}
      className="text-sm font-semibold text-green-600"
    >
      Explore all products →
    </Link>
  </div>
</div>

 <ProductSeller />
                   
                   <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white">
  <button
    type="button"
    className="flex w-full items-center justify-between p-4"
  >
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
        📦
      </span>

      <div>
        <p className="font-semibold text-gray-900">
          72 Hours Replacement
        </p>

        <p className="text-xs text-gray-500">
          Easy replacement for damaged products
        </p>
      </div>
    </div>

    <ChevronRight
      size={18}
      className="text-gray-400"
    />
  </button>
</div>

                <button
                  type="button"
                  onClick={openLocationModal}
                  className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-left transition active:bg-[var(--surface-soft)]"
                >
                  
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--primary-light)] text-[var(--primary)]">
                    <MapPin size={20} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-black uppercase tracking-[0.09em] text-[var(--text-muted)]">
                      Delivery location
                    </span>

                    <span className="mt-1 block truncate text-sm font-black text-[var(--text-primary)]">
                      {locationHydrated && location
                        ? `${location.area}, ${location.pincode}`
                        : "Select your delivery location"}
                    </span>

                    <span className="mt-1 block text-[10px] font-bold text-[var(--primary)]">
                      {locationHydrated && location
                        ? `Delivery in ${location.deliveryMinutes}`
                        : "Check availability in your area"}
                    </span>
                  </span>

                  <ChevronRight
                    size={18}
                    className="shrink-0 text-[var(--text-muted)]"
                  />
                </button>

                <div className="mt-5 hidden items-center gap-3 sm:flex">
                  {quantity === 0 ? (
                    <button
                      type="button"
                      onClick={() => addItem(product, selectedVariant)}
                      disabled={
                        !cartHydrated || selectedStock <= 0
                      }
                      className="flex h-[54px] flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[var(--primary)] bg-white text-sm font-black text-[var(--primary)] transition hover:bg-[var(--primary-light)] disabled:opacity-50"
                    >
                      <ShoppingBag size={19} />
                      Add to cart
                    </button>
                  ) : (
                    <QuantitySelector
                      quantity={quantity}
                      max={selectedStock}
                      onIncrease={() =>
                        increaseItem(product.id, selectedVariant?.id)
                      }
                      onDecrease={() =>
                        decreaseItem(product.id, selectedVariant?.id)
                      }
                      className="h-[54px] flex-1 justify-between rounded-2xl"
                    />
                  )}

                  <button
                    type="button"
                    onClick={buyNow}
                    disabled={!cartHydrated || selectedStock <= 0}
                    className="flex h-[54px] flex-1 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Buy now
                  </button>
                </div>

                <div className="mt-4">
  <ProductShare product={product} />
</div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <ServiceRow
                    icon={Truck}
                    title="Fast local delivery"
                    description={`Usually delivered in ${product.deliveryMinutes} minutes`}
                  />

                  <ServiceRow
                    icon={PackageCheck}
                    title="Fresh inventory"
                    description="Picked from nearby local stock"
                  />

                  <ServiceRow
                    icon={ShieldCheck}
                    title="Quality assurance"
                    description="Products checked before dispatch"
                  />

                  <ServiceRow
                    icon={RotateCcw}
                    title="Order support"
                    description="Support available for damaged items"
                  />
                </div>
              </div>
            </div>
          </section>
           {/* Main product detail section ends */}
<section className="py-6">

  
  
</section>


<section className="py-6">
  <ProductTabs product={product} />
</section>
                 <section className="py-6">
                <FrequentlyBoughtTogether product={product} />
               </section>



                 <section className="py-6">
           <ProductReviews productId={product.id} />
           </section>

<section className="py-6">
  <ProductDeliveryInfo
    deliveryMinutes={product.deliveryMinutes}
  />
</section>

           <section className="py-6">
  <ProductQuestions
    productName={product.name}
  />
</section>
<section className="py-6">
  <ProductRatingSummary
    rating={product.rating}
    reviewCount={product.reviewCount}
  />
</section>

          {relatedProducts.length > 0 && (
            <section className="py-8">
                {/* Similar products */}
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                   
                  

                  <h2 className="text-[22px] font-black tracking-[-0.035em] text-[var(--text-primary)] sm:text-[28px]">
                    Similar products
                  </h2>

                  <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                    More options from this category
                  </p>
                </div>

                <Link
                  href={`/category/${product.categorySlug}`}
                  className="shrink-0 text-xs font-black text-[var(--primary)]"
                >
                  View all →
                </Link>
              </div>

              <div className="-mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {relatedProducts.map((item) => (
                  <div
                    key={item.id}
                    className="w-[174px] shrink-0 snap-start sm:w-auto"
                  >
                    <ProductCard product={item} />
                  </div>
                ))}
              </div>
            </section>
          )}
          <RecentlyViewed currentProductId={product.id} />
        </Container>
      </main>

      <div className="safe-bottom fixed inset-x-0 bottom-[64px] z-40 border-t border-[var(--border)] bg-white/96 p-3 shadow-[0_-10px_35px_rgba(15,23,18,0.10)] backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => addItem(product, selectedVariant)}
              disabled={!cartHydrated || selectedStock <= 0}
              className="flex h-[50px] flex-1 items-center justify-center rounded-2xl border-2 border-[var(--primary)] text-xs font-black text-[var(--primary)] disabled:opacity-50"
            >
              Add to cart
            </button>
          ) : (
            <QuantitySelector
              quantity={quantity}
              max={selectedStock}
              onIncrease={() => increaseItem(product.id, selectedVariant?.id)}
              onDecrease={() => decreaseItem(product.id, selectedVariant?.id)}
              className="h-[50px] flex-1 justify-between rounded-2xl"
            />
          )}

          <button
            type="button"
            onClick={buyNow}
            disabled={!cartHydrated || selectedStock <= 0}
            className="flex h-[50px] flex-1 items-center justify-center rounded-2xl bg-[var(--primary)] text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now · {formatPrice(selectedPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}

type ProductBenefitProps = {
  icon: typeof ShieldCheck;
  title: string;
};

function ProductBenefit({
  icon: Icon,
  title,
}: ProductBenefitProps) {
  return (
    <div className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white p-2 text-center">
      <Icon size={16} className="text-[var(--primary)]" />

      <span className="text-[9px] font-black leading-3 text-[var(--text-secondary)]">
        {title}
      </span>
    </div>
  );
}

type ServiceRowProps = {
  icon: typeof Truck;
  title: string;
  description: string;
};

function ServiceRow({
  icon: Icon,
  title,
  description,
}: ServiceRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface-soft)] p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--primary)]">
        <Icon size={17} />
      </span>

      <div>
        <p className="text-xs font-black text-[var(--text-primary)]">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-[var(--text-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}
