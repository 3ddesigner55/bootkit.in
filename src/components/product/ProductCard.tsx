"use client";
import ProductDrawer from "./ProductDrawer";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Heart, Star } from "lucide-react";
import { type PointerEvent, useState } from "react";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice, percentageOff, safeImageUrl } from "@/lib/utils";
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

  const productId = product.id || product._id || (product as any).referenceId || "";

  const price =
    typeof product.price === "number" && !isNaN(product.price)
      ? product.price
      : typeof (product as any).sellingPrice === "number" && !isNaN((product as any).sellingPrice)
      ? (product as any).sellingPrice
      : 0;

  const mrp =
    typeof product.mrp === "number" && !isNaN(product.mrp) && product.mrp > 0
      ? product.mrp
      : price;

  const discount =
    (product as any).discountPercent ||
    (product as any).discount ||
    percentageOff(mrp, price);

  const stock = typeof product.stock === "number" ? product.stock : 10;

  const unitVal = (product as any).unit;
  const unitLabel =
    typeof unitVal === "object" && unitVal?.label
      ? unitVal.label
      : typeof unitVal === "string" && unitVal.trim()
      ? unitVal
      : (product as any).weight
      ? `${(product as any).weight} g`
      : "1 pc";

  const brandLabel =
    typeof product.brand === "string"
      ? product.brand
      : (product.brand as any)?.name || (product as any).brandName || "";

  const rating =
    typeof product.rating === "number" && product.rating > 0
      ? product.rating
      : 4.8;

  const deliveryMinutes =
    typeof product.deliveryMinutes === "number" && product.deliveryMinutes > 0
      ? product.deliveryMinutes
      : 10;

  const quantity = cartHydrated && productId ? getQuantity(productId) : 0;
  const liked = wishlistHydrated && productId ? isWishlisted(productId) : false;

  const normalizedProduct: Product = {
    ...product,
    id: productId,
    _id: productId,
    price,
    mrp,
    stock,
    unit: typeof unitVal === "object" && unitVal !== null ? unitVal : { label: unitLabel, value: unitLabel },
    brand: brandLabel,
    rating,
    deliveryMinutes,
  };

  const productImages: string[] = Array.isArray(product.images)
    ? product.images.filter((img): img is string => Boolean(img)).map((img) => safeImageUrl(img))
    : Array.isArray((product as any).gallery)
    ? (product as any).gallery.filter((img: any): img is string => Boolean(img)).map((img: string) => safeImageUrl(img))
    : [];

  const primaryImage = safeImageUrl(
    (product.image && typeof product.image === "string" && product.image.trim()) ||
    (product.thumbnail && typeof product.thumbnail === "string" && product.thumbnail.trim()) ||
    (productImages.length > 0 && productImages[0]) ||
    "/images/placeholder.png"
  );

  const galleryImages: string[] =
    productImages && productImages.length > 0
      ? productImages
      : [primaryImage];

  const handleImagePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isBestSellerPopup || galleryImages.length < 2) return;

    setDragStartX(event.clientX);
    setDidSwipe(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleImagePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isBestSellerPopup || galleryImages.length < 2 || dragStartX === null) {
      return;
    }

    const dragDistance = event.clientX - dragStartX;

    if (Math.abs(dragDistance) > 40) {
      setDidSwipe(true);
      setActiveImageIndex((currentIndex) => {
        if (dragDistance < 0) {
          return (currentIndex + 1) % galleryImages.length;
        }

        return (currentIndex - 1 + galleryImages.length) % galleryImages.length;
      });
    }

    setDragStartX(null);
  };

  const cartControl =
    quantity === 0 ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          addItem(normalizedProduct);
        }}
        disabled={!cartHydrated || stock <= 0}
        className={`h-7 bg-[var(--primary)] text-xs font-black uppercase tracking-[0.06em] text-white transition hover:scale-105 hover:bg-green-700 ${
          isBestSellerPopup
            ? "min-w-[72px] rounded-full"
            : "min-w-[72px] rounded-xl"
        }`}
      >
        {stock > 0 ? "Add" : "Out"}
      </button>
    ) : (
      <div onClick={(e) => e.stopPropagation()}>
        <QuantitySelector
          quantity={quantity}
          max={stock}
          onIncrease={() => increaseItem(productId)}
          onDecrease={() => decreaseItem(productId)}
          className="h-7"
        />
      </div>
    );

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-white p-3 transition duration-300 hover:-translate-y-2 hover:border-[var(--border-strong)] sm:p-4 ${
        isBestSellerPopup
          ? "shadow-md hover:shadow-lg"
          : "shadow-[var(--shadow-xs)] hover:shadow-xl"
      }`}
    >
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
          className="block w-full overflow-hidden rounded-[16px] bg-[var(--surface-soft)]"
        >
          <div
            className={`relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-[#FCFCFC] ${
              isBestSellerPopup ? "h-[120px]" : "aspect-square"
            }`}
          >
            {isBestSellerPopup && galleryImages.length > 0 && !imageFailed ? (
              <>
                <div
                  className="flex h-full w-full shrink-0 transition-transform duration-[250ms] ease-out"
                  style={{
                    width: `${galleryImages.length * 100}%`,
                    transform: `translateX(-${
                      (activeImageIndex * 100) / galleryImages.length
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
                        unoptimized={image.startsWith("/")}
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
            ) : (
              <Image
                src={imageFailed ? "/images/placeholder.png" : primaryImage}
                alt={product.name}
                fill
                unoptimized={primaryImage.startsWith("/")}
                sizes="(max-width: 740px) 45vw, (max-width: 1024px) 25vw, 220px"
                className={`object-contain ${
                  isBestSellerPopup ? "p-0.5" : "p-5"
                } transition duration-300 group-hover:scale-105`}
                onError={() => setImageFailed(true)}
              />
            )}
          </div>
        </button>

        {!isBestSellerPopup && discount > 0 && (
          <span
            className={`absolute left-2 top-2 bg-[var(--primary)] px-2 py-1 font-black uppercase tracking-[0.08em] text-white ${
              isBestSellerPopup
                ? "rounded-full text-[10px]"
                : "rounded-lg text-[9px]"
            }`}
          >
            {discount}% off
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(normalizedProduct);
          }}
          disabled={!wishlistHydrated}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/70 bg-white/90 text-[var(--text-secondary)] backdrop-blur transition hover:text-[var(--danger)] disabled:opacity-50 ${
            isBestSellerPopup ? "shadow-md" : "shadow-sm"
          }`}
        >
          <Heart
            size={16}
            fill={liked ? "currentColor" : "none"}
            className={liked ? "text-[var(--danger)]" : ""}
          />
        </button>

        {!isBestSellerPopup && (
          <div
            className={`absolute left-2 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[var(--text-primary)] shadow ${
              isBestSellerPopup ? "bottom-3" : "bottom-2"
            }`}
          >
            <Clock3 size={11} className="text-[var(--primary)]" />
            {deliveryMinutes} min
          </div>
        )}
      </div>

      {isBestSellerPopup ? (
        <div className="flex flex-1 flex-col pt-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              {unitLabel}
            </span>

            {cartControl}
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-[18px] font-black tracking-[-0.025em] text-[var(--text-primary)]">
                {formatPrice(price)}
              </p>

              {mrp > price && (
                <p className="text-[10px] font-medium text-[var(--text-muted)] line-through">
                  {formatPrice(mrp)}
                </p>
              )}
            </div>

            {discount > 0 && (
              <p className="mt-0.5 text-xs font-black text-[var(--primary)]">
                {discount}% OFF
              </p>
            )}
          </div>

          <Link href={`/product/${product.slug}`} className="mt-2">
            <h3 className="line-clamp-2 text-[13px] font-extrabold leading-5 text-[var(--text-primary)] transition group-hover:text-[var(--primary)] sm:text-sm">
              {product.name}
            </h3>
          </Link>

          <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[10px] font-bold text-[var(--text-secondary)]">
            <div className="flex items-center gap-1 rounded-full bg-[#FFF7E0] px-2 py-1">
              <Star size={11} fill="currentColor" className="text-[#F59E0B]" />
              <span className="text-[10px] font-bold">{rating}</span>
            </div>

            <span className="flex items-center gap-1">
              <Clock3 size={11} className="text-[var(--primary)]" />
              {deliveryMinutes} min
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col pt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {brandLabel}
          </p>

          <Link href={`/product/${product.slug}`} className="mt-1">
            <h3 className="line-clamp-2 min-h-10 text-[13px] font-extrabold leading-5 text-[var(--text-primary)] transition group-hover:text-[var(--primary)] sm:text-sm">
              {product.name}
            </h3>
          </Link>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[var(--text-muted)]">
              {unitLabel}
            </span>

            {cartControl}
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 pt-4">
            <div className="mt-3">
              <p className="text-[18px] font-black tracking-[-0.025em] text-[var(--text-primary)]">
                {formatPrice(price)}
              </p>

              {mrp > price && (
                <p className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)] line-through">
                  {formatPrice(mrp)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <ProductDrawer
        open={drawerOpen}
        product={normalizedProduct}
        onClose={() => setDrawerOpen(false)}
      />
    </article>
  );
}
