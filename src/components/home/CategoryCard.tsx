import Image from "next/image";
import Link from "next/link";

interface CategoryCardProps {
  name: string;
  image: string;
  href?: string;
  bg?: string;
  onClick?: () => void;
}

export default function CategoryCard({
  name,
  image,
  href = "/categories",
  bg = "#F3F8F4",
  onClick,
}: CategoryCardProps) {
  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (!onClick) return;

    e.preventDefault();
    onClick();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="group flex flex-col items-center"
    >
      <div
        className="flex h-[74px] w-[74px] items-center justify-center rounded-2xl border border-[#edf2ee] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md"
        style={{ background: bg }}
      >
        {image?.trim() ? (
  <Image
    src={image}
    alt={name}
    width={56}
    height={56}
    className="object-contain transition-transform duration-300 group-hover:scale-105"
  />
) : (
  <span className="text-3xl">📦</span>
)}
      </div>

      <p className="mt-2 line-clamp-2 text-center text-[11px] font-semibold leading-4 text-[var(--text-primary)]">
        {name}
      </p>
    </Link>
  );
}