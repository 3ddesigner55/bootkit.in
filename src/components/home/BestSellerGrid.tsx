import Image from "next/image";
import Link from "next/link";

const bestSellers = [
  {
    title: "Dairy & Breakfast",
    count: "48+ Items",
    images: [
      "/images/products/cream milk.jpg",
      "/images/products/Butter.webp",
      "/images/products/cheese.png",
      "/images/products/Biscuit.png",
    ],
  },
  {
    title: "Fresh Fruits",
    count: "36+ Items",
    images: [
      "/images/products/apple.jpg",
      "/images/products/banana.png",
      "/images/products/orange.png",
      "/images/products/tomato.png",
    ],
  },
  {
    title: "Cold Drinks",
    count: "24+ Items",
    images: [
      "/images/products/coca-cola.png",
      "/images/products/thums up.png",
      "/images/products/limca.png",
      "/images/products/orange juice.png",
    ],
  },
  {
    title: "Vegetables",
    count: "30+ Items",
    images: [
      "/images/products/potato.png",
      "/images/products/onion.png",
      "/images/products/tomato.png",
      "/images/products/banana.png",
    ],
  },
  {
    title: "Snacks",
    count: "18+ Items",
    images: [
      "/images/products/Biscuit.png",
      "/images/products/cheese.png",
      "/images/products/Butter.webp",
      "/images/products/orange juice.png",
    ],
  },
  {
    title: "More",
    count: "100+ Items",
    images: [
      "/images/products/apple.jpg",
      "/images/products/coca-cola.png",
      "/images/products/potato.png",
      "/images/products/cream milk.jpg",
    ],
  },
];

export default function BestSellerGrid() {
  return (
    <section className="mt-6">

      <div className="mb-4 flex items-center justify-between">

        <h2 className="text-xl font-black">
          Best Sellers
        </h2>

        <Link
          href="/categories"
          className="text-sm font-semibold text-[var(--primary)]"
        >
          View All →
        </Link>

      </div>

      <div className="grid grid-cols-3 gap-3">

        {bestSellers.map((item) => (

          <Link
            href="/categories"
            key={item.title}
            className="rounded-2xl border border-[#edf2ee] bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >

            <div className="grid grid-cols-2 gap-2">

              {item.images.map((image) => (

                <div
                  key={image}
                  className="flex aspect-square items-center justify-center rounded-xl bg-[#F5F8F5] p-1"
                >

                  <Image
                    src={image}
                    alt=""
                    width={40}
                    height={40}
                    className="object-contain"
                  />

                </div>

              ))}

            </div>

            <p className="mt-3 text-[13px] font-bold">
              {item.title}
            </p>

            <div className="mt-2 flex items-center justify-between">

  <span className="text-[11px] text-[var(--text-muted)]">
    {item.count}
  </span>

  <span className="text-[var(--primary)] font-bold">
    →
  </span>

</div>

          </Link>

        ))}

      </div>

    </section>
  );
}