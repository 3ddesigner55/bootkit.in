
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Download,
  MapPin,
  ShoppingBasket,
  Sparkles,
} from "lucide-react";
import Container from "@/components/ui/Container";

const quickCategories = [
  "Fresh Fruits",
  "Vegetables",
  "Dairy",
  "Snacks",
  "Beverages",
];

export default function HeroSection() {
  return (
    <section className="overflow-hidden py-4 sm:py-6 lg:py-8">
      <Container>
        <div className="relative overflow-hidden rounded-[26px] border border-[#dfe8dc] bg-[#edf7ea] px-5 py-8 shadow-[var(--shadow-sm)] sm:px-8 sm:py-10 lg:min-h-[430px] lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/60 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#d4ebcf]/70 blur-3xl" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe1ca] bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--primary)] shadow-sm backdrop-blur sm:text-xs">
                <Sparkles size={14} />
                Premium local delivery
              </div>

              <h1 className="mt-5 max-w-3xl text-[38px] font-black leading-[0.98] tracking-[-0.055em] text-[var(--text-primary)] sm:text-[48px] lg:text-[64px]">
                Groceries delivered in 10–20 minutes.
                <span className="block text-[var(--primary)]">
                Fresh. Fast. Affordable.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[14px] leading-6 text-[var(--text-secondary)] sm:text-[16px] sm:leading-7">
                Fresh groceries, vegetables, fruits, dairy and daily essentials delivered to your doorstep in just 10–20 minutes.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
  <Link
    href="/categories"
    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
  >
    Order Online
    <ArrowRight size={18} />
  </Link>

  <Link
    href="#"
    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--primary)] bg-white px-6 text-sm font-semibold text-[var(--primary)] transition hover:bg-[var(--primary-light)]"
  >
    <Download size={18} />
    Download App
  </Link>
</div>

              <div className="mt-7 flex flex-wrap gap-2">
                {quickCategories.map((category) => (
                  <Link
                    key={category}
                    href={`/search?q=${encodeURIComponent(category)}`}
                    className="rounded-full border border-white bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] shadow-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[470px]">
              <div className="relative rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-5">
                <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-soft)] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
                      <ShoppingBasket size={20} />
                    </span>

                    <div>
                      <p className="text-xs font-semibold text-[var(--text-muted)]">
                        Your neighbourhood store
                      </p>
                      <p className="text-sm font-extrabold text-[var(--text-primary)]">
                        BootKiT Fresh Market
                      </p>
                    </div>
                  </div>

                  <BadgeCheck
                    size={21}
                    className="text-[var(--primary)]"
                    fill="currentColor"
                    strokeWidth={1.8}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <div className="flex h-20 items-center justify-center rounded-xl bg-[#fff3d8] text-[44px]">
                      🍎
                    </div>
                    <p className="mt-3 text-sm font-extrabold text-[var(--text-primary)]">
                      Fresh Produce
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Fruits and vegetables
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <div className="flex h-20 items-center justify-center rounded-xl bg-[#e9f4ff] text-[44px]">
                      🥛
                    </div>
                    <p className="mt-3 text-sm font-extrabold text-[var(--text-primary)]">
                      Dairy & More
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Milk, bread and breakfast
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-2xl bg-[var(--primary)] px-4 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <Clock3 size={20} />

                    <div>
                      <p className="text-[11px] font-medium text-white/70">
                        Estimated delivery
                      </p>
                      <p className="text-sm font-extrabold">10–20 minutes</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em]">
                    Selected areas
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-3 hidden rounded-2xl border border-white bg-white px-4 py-3 shadow-[var(--shadow-md)] sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Quality promise
                </p>
                <p className="mt-1 text-sm font-extrabold text-[var(--primary)]">
                  Fresh • Trusted • Fast
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}