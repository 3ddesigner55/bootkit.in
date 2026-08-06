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
      className={`min-w-[270px] rounded-[22px] bg-gradient-to-br ${color} p-5 text-white shadow-lg`}
    >
      <p className="text-xs uppercase tracking-[0.12em] text-white/70">
        BOOTKIT
      </p>

      <h3 className="mt-3 text-2xl font-black">
        {title}
      </h3>

      <p className="mt-2 text-sm text-white/80">
        {subtitle}
      </p>
    </div>
  );
}