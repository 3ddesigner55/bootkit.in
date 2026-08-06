import Image from "next/image";
import Link from "next/link";

interface CategoryCollectionCardProps {
  title: string;
  count: string;
  slug: string;
  images: string[];
}

export default function CategoryCollectionCard({
  title,
  count,
  slug,
  images,
}: CategoryCollectionCardProps) {
  return (
    <Link
      href={`/category/${slug}`}
      className="rounded-2xl border border-[#edf2ee] bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="grid grid-cols-2 gap-2">
        {images.slice(0, 4).map((image) => (
          <div
            key={image}
            className="flex aspect-square items-center justify-center rounded-xl bg-[#F5F8F5] p-1"
          >
            <Image
              src={image}
              alt={title}
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        ))}
      </div>

      <p className="mt-3 text-[13px] font-bold">
        {title}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-muted)]">
          {count}
        </span>

        <span className="font-bold text-[var(--primary)]">
          →
        </span>
      </div>
    </Link>
  );
}