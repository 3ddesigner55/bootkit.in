interface OfferCardProps {
  title: string;
  subtitle: string;
  color: string;
}

export default function OfferCard({
  title,
  subtitle,
  color,
}: OfferCardProps) {
  return (
    <div
      className={`min-w-[150px] rounded-[16px] bg-gradient-to-br ${color} px-4 py-1 text-white shadow-lg`}
    >

      <h3 className="mt-2 text-[10px] font-black">
        {title}
      </h3>

      <p className="mt-2 text-[8px] text-white/80">
        {subtitle}
      </p>
    </div>
  );
}