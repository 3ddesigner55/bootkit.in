type CategorySvgIconProps = {
  slug: string;
  active: boolean;
};

export default function CategorySvgIcon({
  slug,
  active,
}: CategorySvgIconProps) {
  if (slug === "all") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="2"
          fill={active ? "#22C55E" : "none"}
          stroke={active ? "#22C55E" : "currentColor"}
          strokeWidth="1.8"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="2"
          fill={active ? "#F59E0B" : "none"}
          stroke={active ? "#F59E0B" : "currentColor"}
          strokeWidth="1.8"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="2"
          fill={active ? "#3B82F6" : "none"}
          stroke={active ? "#3B82F6" : "currentColor"}
          strokeWidth="1.8"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="2"
          fill={active ? "#EF4444" : "none"}
          stroke={active ? "#EF4444" : "currentColor"}
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (slug === "fruits-vegetables") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 8c-4.5 0-7 2.8-7 6.3C5 18.5 8.2 21 12 21s7-2.5 7-6.7C19 10.8 16.5 8 12 8Z"
          fill={active ? "#EF4444" : "none"}
          stroke={active ? "#EF4444" : "currentColor"}
          strokeWidth="1.7"
        />

        <path
          d="M12 8c0-2.8 1.5-4.4 4-5"
          stroke={active ? "#16A34A" : "currentColor"}
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        <path
          d="M13.7 5.2c1.6-.3 3 .2 3.8 1.3-1.6.5-3 .3-3.8-1.3Z"
          fill={active ? "#22C55E" : "none"}
          stroke={active ? "#22C55E" : "currentColor"}
          strokeWidth="1.4"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}