import Link from "next/link";
import FeaturedProductCard from "./FeaturedProductCard";
import { FEATURED_PRODUCTS } from "./featuredData";

export default function FeaturedProducts() {
  return (
    <section className="mt-6">

      <div className="mb-4 flex items-center justify-between">

        <h2 className="text-2xl font-black">
          Featured Products
        </h2>

        <Link
          href="/products"
          className="text-sm font-semibold text-[var(--primary)]"
        >
          View All →
        </Link>

      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">

        {FEATURED_PRODUCTS.map((item) => (

          <FeaturedProductCard
            key={item.name}
            {...item}
          />

        ))}

      </div>

    </section>
  );
}