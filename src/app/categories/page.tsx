"use client";

import Image from "next/image";
import Link from "next/link";
import { Mic, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import HomeHeader from "@/components/home/HomeHeader";
import {
  getCategories,
  type CategoryData,
} from "@/services/category.service";

type HubSection = {
  title: string;
  imageOnly?: boolean;
  categories: CategoryData[];
};

const SECTION_DEFINITIONS = [
  {
    key: "groceryKitchen",
    title: "Grocery & Kitchen",
  },
  {
    key: "snacksDrinks",
    title: "Snacks & Drinks",
  },
  {
    key: "beautyPersonalCare",
    title: "Beauty & Personal Care",
  },
  {
    key: "householdEssentials",
    title: "Household Essentials",
  },
] as const;

function sortCategories(
  first: CategoryData,
  second: CategoryData,
): number {
  const firstOrder =
    first.displayOrder ?? first.sortOrder ?? Number.MAX_SAFE_INTEGER;

  const secondOrder =
    second.displayOrder ?? second.sortOrder ?? Number.MAX_SAFE_INTEGER;

  return (
    firstOrder - secondOrder ||
    first.name.localeCompare(second.name)
  );
}

function getCategoryImage(
  category: CategoryData,
): string | undefined {
  if (category.image) {
    return category.image;
  }

  const thumbnail = category.productThumbnails?.find(Boolean);

  if (thumbnail) {
    return thumbnail;
  }

  const icon = category.icon?.trim();

  if (
    icon?.startsWith("/") ||
    icon?.startsWith("http://") ||
    icon?.startsWith("https://")
  ) {
    return icon;
  }

  return undefined;
}

function getCategoryIcon(category: CategoryData): string {
  const icon = category.icon?.trim();

  if (
    !icon ||
    icon.startsWith("/") ||
    icon.startsWith("http://") ||
    icon.startsWith("https://")
  ) {
    return "🛒";
  }

  return icon;
}

function buildSections(categories: CategoryData[]): HubSection[] {
  const rootCategories = categories
    .filter(
      (category) =>
        category.active && !category.parentCategory,
    )
    .sort(sortCategories);

  const primarySections: HubSection[] =
    SECTION_DEFINITIONS.map((section) => ({
      title: section.title,
      categories: rootCategories
        .filter(
          (category) =>
            category.homeSection === section.key,
        )
        .sort(sortCategories),
    })).filter((section) => section.categories.length > 0);

  const assignedCategoryIds = new Set(
    primarySections.flatMap((section) =>
      section.categories.map((category) => category.id),
    ),
  );

  const otherCategories = rootCategories.filter(
    (category) => !assignedCategoryIds.has(category.id),
  );

  const featuredCategories = rootCategories.filter(
    (category) => category.featured,
  );

  const lifestyleCategories = rootCategories.filter(
    (category) => Boolean(category.collectionHub),
  );

  const sections: HubSection[] = [...primarySections];

  if (otherCategories.length > 0) {
    sections.push({
      title: "More Categories",
      categories: otherCategories,
    });
  }

  if (featuredCategories.length > 0) {
    sections.push({
      title: "Store Spotlight",
      imageOnly: true,
      categories: featuredCategories,
    });
  }

  if (lifestyleCategories.length > 0) {
    sections.push({
      title: "Picks For Your Lifestyle",
      imageOnly: true,
      categories: lifestyleCategories,
    });
  }

  return sections;
}

export default function CategoriesHubPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void getCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
          setError("Unable to load categories. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(
    () => buildSections(categories),
    [categories],
  );

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return sections;
    }

    return sections
      .map((section) => {
        const sectionMatches = section.title
          .toLowerCase()
          .includes(normalizedQuery);

        return {
          ...section,
          categories: sectionMatches
            ? section.categories
            : section.categories.filter((category) =>
                category.name
                  .toLowerCase()
                  .includes(normalizedQuery),
              ),
        };
      })
      .filter((section) => section.categories.length > 0);
  }, [query, sections]);

  return (
    <main className="min-h-screen bg-[#F8FAF8] pb-28">
      <div className="sticky top-0 z-40 bg-[#F8FAF8]">
        <div className="mx-auto max-w-md px-4">
          <HomeHeader />

          <div className="relative mt-5 pb-4">
            <div className="flex h-[58px] items-center gap-3 rounded-[20px] border border-[#e6efe8] bg-white px-4 shadow-[0_8px_25px_rgba(0,0,0,.05)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F8F5]">
                <Search
                  size={18}
                  className="text-[var(--primary)]"
                />
              </div>

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search groceries, fruits, milk..."
                aria-label="Search categories"
                className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />

              <button
                type="button"
                aria-label="Voice search"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)]"
              >
                <Mic
                  size={18}
                  className="text-[var(--primary)]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-6 pt-6">
        {loading ? (
          <p className="py-12 text-center text-sm font-semibold text-[var(--text-muted)]">
            Loading categories...
          </p>
        ) : error ? (
          <p className="py-12 text-center text-sm font-bold text-[var(--danger)]">
            {error}
          </p>
        ) : filteredSections.length === 0 ? (
          <p className="py-12 text-center text-sm font-semibold text-[var(--text-muted)]">
            No categories found.
          </p>
        ) : (
          <div className="space-y-8">
            {filteredSections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-4 text-lg font-black text-[var(--text-primary)]">
                  {section.title}
                </h2>

                <div className="grid grid-cols-4 gap-x-3 gap-y-5">
                  {section.categories.map((category) => {
                    const image = getCategoryImage(category);

                    return (
                      <Link
                        key={`${section.title}-${category.id}`}
                        href={`/category/${category.slug}`}
                        aria-label={category.name}
                        className="group flex min-w-0 flex-col items-center"
                      >
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white shadow-[0_3px_12px_rgba(25,50,34,0.06)] transition group-active:scale-95">
  <span
    className="absolute inset-0 flex items-center justify-center text-3xl"
    aria-hidden="true"
  >
    {getCategoryIcon(category)}
  </span>

  {image ? (
    <Image
      src={image}
      alt=""
      fill
      sizes="(max-width: 480px) 25vw, 100px"
      className="z-10 object-cover"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  ) : null}
</div>

                        {section.imageOnly ? null : (
                          <p className="mt-2 min-h-8 line-clamp-2 text-center text-[11px] font-semibold leading-4 text-[var(--text-secondary)]">
                            {category.name}
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}