import Image from "next/image";

interface Props {
  name: string;
  image: string;
  price: number;
  oldPrice: number;
  discount: number;
  unit: string;
}

export default function FeaturedProductCard({
  name,
  image,
  price,
  oldPrice,
  discount,
  unit,
}: Props) {
  return (
    <div className="min-w-[145px] rounded-[20px] bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,.05)]">

      <span className="rounded-full bg-green-100 px-2 py-1 text-[9px] font-bold text-green-700">
        {discount}% OFF
      </span>

      <div className="mt-2 flex justify-center">

        <Image
          src={image}
          alt={name}
          width={75}
          height={75}
          className="object-contain"
        />

      </div>

      <h3 className="mt-2 line-clamp-1 text-[13px] font-bold">
        {name}
      </h3>

      <p className="text-[11px] text-[var(--text-muted)]">
        {unit}
      </p>

      <div className="mt-2 flex items-center gap-2">

        <span className="text-sm font-black text-[var(--primary)]">
          ₹{price}
        </span>

        <span className="text-[10px] text-gray-400 line-through">
          ₹{oldPrice}
        </span>

      </div>

      <button className="mt-3 w-full rounded-xl border border-[var(--primary)] bg-[var(--primary-light)] py-1.5 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white">
        ADD
      </button>

    </div>
  );
}