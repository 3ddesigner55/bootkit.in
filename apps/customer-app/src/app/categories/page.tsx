import Image from "next/image";
import Link from "next/link";
import { Mic, Search } from "lucide-react";

import HomeHeader from "@/components/home/HomeHeader";

type HubCategory = {
  name: string;
  slug: string;
  icon: string;
  image?: string;
};

type HubSection = {
  title: string;
  imageOnly?: boolean;
  categories: HubCategory[];
};

const hubSections: HubSection[] = [
  {
    title: "Grocery & Kitchen",
    categories: [
      {
        name: "Fruits & Vegetables",
        slug: "fruits-vegetables",
        icon: "🥦",
        image: "/images/categories/fruits-vegetables.png",
      },
      {
        name: "Dairy & Breakfast",
        slug: "dairy-breakfast",
        icon: "🥛",
        image: "/images/categories/dairy-breakfast.png",
      },
      {
        name: "Atta, Rice & Dal",
        slug: "atta-rice-dal",
        icon: "🌾",
        image: "/images/categories/atta-rice-dal.png",
      },
      {
        name: "Bakery & Biscuits",
        slug: "bakery-biscuits",
        icon: "🥐",
        image: "/images/categories/bakery-biscuits.png",
      },
      { name: "Frozen Food", slug: "frozen-food", icon: "❄️" },
      { name: "Home Care", slug: "home-care", icon: "🧹" },
      { name: "Snacks & Munchies", slug: "snacks-munchies", icon: "🍿" },
      { name: "Cold Drinks & Juices", slug: "cold-drinks-juices", icon: "🧃" },
    ],
  },
  {
    title: "Snacks & Drinks",
    categories: [
      { name: "Cold Drinks", slug: "cold-drinks", icon: "🥤" },
      { name: "Tea & Coffee", slug: "tea-coffee", icon: "☕" },
      { name: "Juices", slug: "juices", icon: "🧃" },
      { name: "Energy Drinks", slug: "energy-drinks", icon: "⚡" },
      { name: "Chips & Namkeen", slug: "chips-namkeen", icon: "🥔" },
      { name: "Biscuits", slug: "biscuits", icon: "🍪" },
      { name: "Chocolates", slug: "chocolates", icon: "🍫" },
      { name: "Ice Cream", slug: "ice-cream", icon: "🍨" },
    ],
  },
  {
    title: "Beauty & Personal Care",
    categories: [
      { name: "Skin Care", slug: "skin-care", icon: "🧴" },
      { name: "Hair Care", slug: "hair-care", icon: "💇" },
      { name: "Bath & Body", slug: "bath-body", icon: "🫧" },
      { name: "Makeup", slug: "makeup", icon: "💄" },
      { name: "Oral Care", slug: "oral-care", icon: "🪥" },
      { name: "Feminine Care", slug: "feminine-care", icon: "🌸" },
      { name: "Baby Care", slug: "baby-care", icon: "🧸" },
      { name: "Health Care", slug: "health-care", icon: "🩹" },
    ],
  },
  {
    title: "Household Essentials",
    categories: [
      {
        name: "Cleaning Supplies",
        slug: "cleaning-supplies",
        icon: "🧹",
        image: "/images/categories/cleaning.png",
      },
      {
        name: "Laundry Care",
        slug: "laundry-care",
        icon: "🫧",
        image: "/images/categories/laundry.png",
      },
      {
        name: "Home Essentials",
        slug: "home-essentials",
        icon: "🏠",
        image: "/images/categories/home.png",
      },
      {
        name: "Storage & Organizers",
        slug: "storage-organizers",
        icon: "🧺",
        image: "/images/categories/storage.png",
      },
      {
        name: "Paper Products",
        slug: "paper-products",
        icon: "🧻",
        image: "/images/categories/paper.png",
      },
      {
        name: "Kitchen Cleaning",
        slug: "kitchen-cleaning",
        icon: "🧽",
        image: "/images/categories/kitchen-cleaning.png",
      },
      {
        name: "Bathroom Care",
        slug: "bathroom-care",
        icon: "🚿",
        image: "/images/categories/bathroom.png",
      },
      {
        name: "Pooja Essentials",
        slug: "pooja-essentials",
        icon: "🪔",
        image: "/images/categories/pooja.png",
      },
    ],
  },
  {
    title: "Store Spotlight",
    imageOnly: true,
    categories: [
      {
        name: "Fruits & Vegetables",
        slug: "fruits-vegetables",
        icon: "🥦",
        image: "/images/categories/fruits-vegetables.png",
      },
      {
        name: "Dairy & Breakfast",
        slug: "dairy-breakfast",
        icon: "🥛",
        image: "/images/categories/dairy-breakfast.png",
      },
      {
        name: "Bakery & Biscuits",
        slug: "bakery-biscuits",
        icon: "🥐",
        image: "/images/categories/bakery-biscuits.png",
      },
      {
        name: "Atta, Rice & Dal",
        slug: "atta-rice-dal",
        icon: "🌾",
        image: "/images/categories/atta-rice-dal.png",
      },
    ],
  },
  {
    title: "Picks For Your Lifestyle",
    imageOnly: true,
    categories: [
      {
        name: "Cleaning Supplies",
        slug: "cleaning-supplies",
        icon: "🧹",
        image: "/images/categories/cleaning.png",
      },
      {
        name: "Laundry Care",
        slug: "laundry-care",
        icon: "🫧",
        image: "/images/categories/laundry.png",
      },
      {
        name: "Home Essentials",
        slug: "home-essentials",
        icon: "🏠",
        image: "/images/categories/home.png",
      },
      {
        name: "Storage & Organizers",
        slug: "storage-organizers",
        icon: "🧺",
        image: "/images/categories/storage.png",
      },
      {
        name: "Paper Products",
        slug: "paper-products",
        icon: "🧻",
        image: "/images/categories/paper.png",
      },
      {
        name: "Kitchen Cleaning",
        slug: "kitchen-cleaning",
        icon: "🧽",
        image: "/images/categories/kitchen-cleaning.png",
      },
      {
        name: "Bathroom Care",
        slug: "bathroom-care",
        icon: "🚿",
        image: "/images/categories/bathroom.png",
      },
      {
        name: "Pooja Essentials",
        slug: "pooja-essentials",
        icon: "🪔",
        image: "/images/categories/pooja.png",
      },
    ],
  },
];

export default function CategoriesHubPage() {
  return (
    <main className="min-h-screen bg-[#F8FAF8] pb-28">
      <div className="sticky top-0 z-40 bg-[#F8FAF8]">
        <div className="mx-auto max-w-md px-4">
          <HomeHeader />

          <div className="relative mt-5 pb-4">
            <div className="flex h-[58px] items-center gap-3 rounded-[20px] border border-[#e6efe8] bg-white px-4 shadow-[0_8px_25px_rgba(0,0,0,.05)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F8F5]">
                <Search size={18} className="text-[var(--primary)]" />
              </div>

              <input
                type="search"
                placeholder="Search groceries, fruits, milk..."
                aria-label="Search categories"
                className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />

              <button
                type="button"
                aria-label="Voice search"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)]"
              >
                <Mic size={18} className="text-[var(--primary)]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-6 pt-6">
        <div className="space-y-8">
          {hubSections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 text-lg font-black text-[var(--text-primary)]">
                {section.title}
              </h2>

              <div className="grid grid-cols-4 gap-x-3 gap-y-5">
                {section.categories.map((category) => (
                  <Link
                    key={`${section.title}-${category.slug}`}
                    href={`/category/${category.slug}`}
                    aria-label={category.name}
                    className="group flex min-w-0 flex-col items-center"
                  >
                    <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-white p-2 shadow-[0_3px_12px_rgba(25,50,34,0.06)] transition group-active:scale-95">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt=""
                          width={72}
                          height={72}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-3xl" aria-hidden="true">
                          {category.icon}
                        </span>
                      )}
                    </div>

                    {section.imageOnly ? null : (
                      <p className="mt-2 line-clamp-2 text-center text-[11px] font-semibold leading-4 text-[var(--text-secondary)]">
                        {category.name}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
