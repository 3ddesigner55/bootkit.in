interface HeroDotsProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

export default function HeroDots({
  total,
  current,
  onSelect,
}: HeroDotsProps) {
  return (
    <div className="mt-5 flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`overflow-hidden rounded-full transition-all duration-300 ${
            current === index
              ? "h-2 w-8 bg-white/30"
              : "h-2 w-2 bg-white/30"
          }`}
        >
          {current === index && (
            <div className="h-full w-full rounded-full bg-white animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}