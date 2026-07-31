"use client";

import Container from "@/components/ui/Container";
import ProductCard from "@/components/product/ProductCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { useAdminProducts } from "@/hooks/useAdminProducts";

export default function ProductSection() {
  const {
    activeProducts,
    hydrated,
  } = useAdminProducts();

  const featuredProducts = activeProducts.filter(
    (product) => product.featured
  );

  const visibleProducts =
    featuredProducts.length > 0
      ? featuredProducts
      : activeProducts.slice(0, 8);

  if (!hydrated) {
    return (
      <section className="py-5 sm:py-7 lg:py-9">
        <Container>
          <SectionHeading
            title="Popular near you"
            description="Frequently ordered essentials available for fast local delivery."
            actionLabel="View all"
            actionHref="/products"
          />

          <div className="-mx-3 flex gap-3 overflow-hidden px-3 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[300px] w-[174px] shrink-0 animate-pulse rounded-[20px] bg-white sm:w-auto"
              />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-5 sm:py-7 lg:py-9">
      <Container>
        <SectionHeading
          title="Popular near you"
          description="Frequently ordered essentials available for fast local delivery."
          actionLabel="View all"
          actionHref="/products"
        />

        <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-6">
          {visibleProducts.map((product) => (
            <div
              key={product.id}
              className="w-[174px] shrink-0 snap-start sm:w-auto"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}