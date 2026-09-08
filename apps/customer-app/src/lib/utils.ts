import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value?: number | null) {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function percentageOff(
  mrp?: number | null,
  salePrice?: number | null
) {
  const m = typeof mrp === "number" && !isNaN(mrp) ? mrp : 0;
  const s = typeof salePrice === "number" && !isNaN(salePrice) ? salePrice : 0;
  if (m <= 0 || s >= m) return 0;
  return Math.round(((m - s) / m) * 100);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function safeImageUrl(src?: string | null): string {
  if (!src || typeof src !== "string") return "/images/placeholder.png";
  const trimmed = src.trim();
  if (!trimmed) return "/images/placeholder.png";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  try {
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return cleanPath
      .split("/")
      .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
      .join("/");
  } catch {
    return trimmed;
  }
}