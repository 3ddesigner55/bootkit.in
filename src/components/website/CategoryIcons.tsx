"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import { getCategories } from "@/services/category.service";
import { useEffect, useState } from "react";

export default function CategoryIcons() {
  const [categories, setCategories] = useState<any[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void getCategories()
      .then((cats) => {
        setCategories(cats);
        setHydrated(true);
      })
      .catch(() => {
        setCategories([]);
        setHydrated(true);
      });
  }, []);


  return (
    <section className="py-10">
      <Container>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">
            Shop by Category
          </h2>

          <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
            Fresh groceries delivered from nearby stores.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group flex flex-col items-center"
            >
              <div
                className="flex h-20 w-20 items-center justify-center rounded-3xl transition duration-300 group-hover:scale-105"
                style={{
                  background: category.background,
                }}
              >
                <span className="text-5xl">
                  {category.icon}
                </span>
              </div>

              <span className="mt-3 text-center text-sm font-medium text-[var(--text-primary)]">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}