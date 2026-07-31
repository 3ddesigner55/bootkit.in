import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  compact?: boolean;
};

export default function Logo({
  className,
  compact = false,
}: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="BootKiT home"
      className={cn(
        "inline-flex items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
        className
      )}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[var(--primary)] shadow-sm">
        <span className="absolute inset-[4px] rounded-[11px] border border-white/20" />

        <span className="relative text-[19px] font-black tracking-[-0.08em] text-white">
          BK
        </span>

        <span className="absolute bottom-[5px] right-[5px] h-2 w-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--primary)]" />
      </span>

      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[24px] font-black tracking-[-0.055em] text-[var(--text-primary)]">
            Boot<span className="text-[var(--primary)]">KiT</span>
          </span>

          <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Fast Local Delivery
          </span>
        </span>
      )}
    </Link>
  );
}