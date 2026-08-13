"use client";
import ProductDrawer from "./ProductDrawer";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Heart, Star } from "lucide-react";
import { type PointerEvent, useState } from "react";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice, percentageOff } from "@/lib/utils";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  variant?: "default" | "bestSellerPopup";
  onClick?: () => void;
};


export default function ProductCard({
  product,
  variant = "default",
  onClick,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [didSwipe, setDidSwipe] = useState(false);
  const isBestSellerPopup = variant === "bestSellerPopup";
  const {
    hydrated: cartHydrated,
    getQuantity,
    addItem,
    increaseItem,
    decreaseItem,
  } = useCart();

  const {
    hydrated: wishlistHydrated,
    isWishlisted,
    toggleWishlist,
  } = useWishlist();

  const quantity = cartHydrated
    ? getQuantity(product.id)
    : 0;

  const liked = wishlistHydrated
    ? isWishlisted(product.id)
    : false;

  const discount = percentageOff(
    product.mrp,
    product.price
  );
  const productImages = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];
  const galleryImages =
    productImages && productImages.length > 0
      ? productImages
      : product.image
        ? [product.image]
        : [];

  const handleImagePointerDown = (
    event: PointerEvent<HTMLButtonElement>
  ) => {
    if (!isBestSellerPopup || galleryImages.length < 2) return;

    setDragStartX(event.clientX);
    setDidSwipe(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleImagePointerUp = (
    event: PointerEvent<HTMLButtonElement>
  ) => {
    if (
      !isBestSellerPopup ||
      galleryImages.length < 2 ||
      dragStartX === null
    ) {
      return;
    }

    const dragDistance = event.clientX - dragStartX;

    if (Math.abs(dragDistance) > 40) {
      setDidSwipe(true);
      setActiveImageIndex((currentIndex) => {
        if (dragDistance < 0) {
          return (currentIndex + 1) % galleryImages.length;
        }

        return (
          (currentIndex - 1 + galleryImages.length) %
          galleryImages.length
        );
      });
    }

    setDragStartX(null);
  };

  const cartControl = quantity === 0 ? (
    <button
      type="button"
      onClick={() => addItem(product)}
      disabled={
        !cartHydrated || product.stock <= 0
      }
      className={`h-7 bg-[var(--primary)] text-xs font-black uppercase tracking-[0.06em] text-white transition hover:scale-105 hover:bg-green-700 ${
        isBestSellerPopup
          ? "min-w-[72px] rounded-full"
          : "min-w-[72px] rounded-xl"
      }`}
    >
      {product.stock > 0 ? "Add" : "Out"}
    </button>
  ) : (
    <QuantitySelector
      quantity={quantity}
      max={product.stock}
      onIncrease={() =>
        increaseItem(product.id)
      }
      onDecrease={() =>
        decreaseItem(product.id)
      }
    />
  );

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-white p-3 transition duration-300 hover:-translate-y-2 hover:border-[var(--border-strong)] sm:p-4 ${
      isBestSellerPopup
        ? "shadow-md hover:shadow-lg"
        : "shadow-[var(--shadow-xs)] hover:shadow-xl"
    }`}>
      <div className="relative">
        
         <button
  type="button"
  onClick={() => {
    if (didSwipe) {
      setDidSwipe(false);
      return;
    }

    if (onClick) {
      onClick();
      return;
    }

    setDrawerOpen(true);
  }}
  onPointerDown={handleImagePointerDown}
  onPointerUp={handleImagePointerUp}
  onPointerCancel={() => setDragStartX(null)}
  aria-label={`View ${product.name}`}
          className="block overflow-hidden rounded-[16px] bg-[var(--surface-soft)]"
        >
          <div
  className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-[#FCFCFC] ${
    isBestSellerPopup ? "h-[120px]" : "aspect-square"
  }`}
>
            {isBestSellerPopup &&
            galleryImages.length > 0 &&
            !imageFailed ? (
              <>
                <div
                  className="flex h-full w-full shrink-0 transition-transform duration-[250ms] ease-out"
                  style={{
                    width: `${galleryImages.length * 100}%`,
                    transform: `translateX(-${
                      (activeImageIndex * 100) /
                      galleryImages.length
                    }%)`,
                  }}
                >
                  {galleryImages.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative h-full shrink-0"
                      style={{
                        width: `${100 / galleryImages.length}%`,
                      }}
                    >
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 740px) 45vw, (max-width: 1024px) 25vw, 220px"
                        className="object-contain p-0.5"
                        onError={() => setImageFailed(true)}
                      />
                    </div>
                  ))}
                </div>

                {galleryImages.length > 1 && (
                  <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                    {galleryImages.map((image, index) => (
                      <span
                        key={image}
                        className={`h-1.5 rounded-full transition-all duration-[250ms] ${
                          activeImageIndex === index
                            ? "w-3 bg-[var(--primary)]"
                            : "w-1.5 bg-black/20"
                        }`}
                      />
                    ))}
                  </span>
                )}
              </>
            ) : product.image && !imageFailed ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 740px) 45vw, (max-width: 1024px) 25vw, 220px"
                className={`object-contain ${
                  isBestSellerPopup ? "p-0.5" : "p-5"
                } transition duration-300 group-hover:scale-105`}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span
                className="text-[62px]"
                aria-hidden="true"
              >
                {product.fallbackIcon}
              </span>
            )}
          </div>
        </button>

        {!isBestSellerPopup && discount > 0 && (
          <span className={`absolute left-2 top-2 bg-[var(--primary)] px-2 py-1 font-black uppercase tracking-[0.08em] text-white ${
            isBestSellerPopup
              ? "rounded-full text-[10px]"
              : "rounded-lg text-[9px]"
          }`}>
            {discount}% off
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          disabled={!wishlistHydrated}
          aria-label={
            liked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/70 bg-white/90 text-[var(--text-secondary)] backdrop-blur transition hover:text-[var(--danger)] disabled:opacity-50 ${
            isBestSellerPopup ? "shadow-md" : "shadow-sm"
          }`}
        >
          <Heart
            size={16}
            fill={liked ? "currentColor" : "none"}
            className={
              liked ? "text-[var(--danger)]" : ""
            }
          />
        </button>

        {!isBestSellerPopup && (
        <div className={`absolute left-2 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[var(--text-primary)] shadow ${
          isBestSellerPopup ? "bottom-3" : "bottom-2"
        }`}>
          <Clock3
            size={11}
            className="text-[var(--primary)]"
          />
          {product.deliveryMinutes} min
        </div>
        )}
      </div>

      {isBestSellerPopup ? (
        <div className="flex flex-1 flex-col pt-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              {product.unit.label}
            </span>

            {cartControl}
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-[18px] font-black tracking-[-0.025em] text-[var(--text-primary)]">
                {formatPrice(product.price)}
              </p>

              {product.mrp > product.price && (
                <p className="text-[10px] font-medium text-[var(--text-muted)] line-through">
                  {formatPrice(product.mrp)}
                </p>
              )}
            </div>

            {discount > 0 && (
              <p className="mt-0.5 text-xs font-black text-[var(--primary)]">
                {discount}% OFF
              </p>
            )}
          </div>

          <Link
            href={`/product/${product.slug}`}
            className="mt-2"
          >
            <h3 className="line-clamp-2 text-[13px] font-extrabold leading-5 text-[var(--text-primary)] transition group-hover:text-[var(--primary)] sm:text-sm">
              {product.name}
            </h3>
          </Link>

          <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[10px] font-bold text-[var(--text-secondary)]">
            <div className="flex items-center gap-1 rounded-full bg-[#FFF7E0] px-2 py-1">
              <Star
                size={11}
                fill="currentColor"
                className="text-[#F59E0B]"
              />

              <span className="text-[10px] font-bold">
                {product.rating}
              </span>
            </div>

            <span className="flex items-center gap-1">
              <Clock3
                size={11}
                className="text-[var(--primary)]"
              />
              {product.deliveryMinutes} min
            </span>
          </div>
        </div>
      ) : (
      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {product.brand}
        </p>

        <Link
          href={`/product/${product.slug}`}
          className="mt-1"
        >
          <h3 className="line-clamp-2 min-h-10 text-[13px] font-extrabold leading-5 text-[var(--text-primary)] transition group-hover:text-[var(--primary)] sm:text-sm">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between">
  <span className="text-[12px] font-semibold text-[var(--text-muted)]">
    {product.unit.label}
  </span>

  {cartControl}
</div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="mt-3">
  <p className="text-[18px] font-black tracking-[-0.025em] text-[var(--text-primary)]">
    {formatPrice(product.price)}
  </p>

  {product.mrp > product.price && (
    <p className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)] line-through">
      {formatPrice(product.mrp)}
    </p>
  )}
</div>

          
        </div>
      </div>
      )}

      <ProductDrawer
  open={drawerOpen}
  product={product}
  onClose={() => setDrawerOpen(false)}
/>
    </article>
  );
}
