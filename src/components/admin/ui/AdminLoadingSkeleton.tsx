type AdminLoadingSkeletonProps = {
  variant?: "cards" | "list" | "page";
  count?: number;
  className?: string;
};

export default function AdminLoadingSkeleton({
  variant = "cards",
  count = 3,
  className = "",
}: AdminLoadingSkeletonProps) {
  if (variant === "page") {
    return (
      <div
        className={`h-[620px] animate-pulse rounded-[28px] bg-white ${className}`}
        aria-label="Loading content"
      />
    );
  }

  const itemClass =
    variant === "list"
      ? "h-28 rounded-[24px]"
      : "h-72 rounded-[24px]";
  const wrapperClass =
    variant === "list" ? "space-y-4" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className={`${wrapperClass} ${className}`} aria-label="Loading content">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${itemClass} animate-pulse bg-white`} />
      ))}
    </div>
  );
}
