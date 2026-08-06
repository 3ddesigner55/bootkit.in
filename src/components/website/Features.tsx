import {
  Clock3,
  Leaf,
  MapPinned,
  ShieldCheck,
} from "lucide-react";

import Container from "@/components/ui/Container";
import { WEBSITE } from "@/constants/website";

const features = [
  {
    icon: Clock3,
    title: "10–20 Minute Delivery",
    description:
      "Groceries delivered quickly from nearby stores.",
  },
  {
    icon: Leaf,
    title: "Fresh Everyday",
    description:
      "Quality fruits, vegetables and daily essentials.",
  },
  {
    icon: MapPinned,
    title: "Live Tracking",
    description:
      "Track your order in real-time from store to doorstep.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description:
      "UPI, Cards, Wallet and Cash on Delivery.",
  },
];

export default function Features() {
  return (
    <section className={WEBSITE.section}>
      <Container>

        <div className="mx-auto max-w-2xl text-center">

          <span className="rounded-full bg-[var(--primary-light)] px-4 py-2 text-sm text-[var(--primary)]">
            Why BootKiT
          </span>

          <h2 className="mt-5 text-3xl lg:text-4xl font-bold tracking-tight">
            Everything you need,
            <br />
            delivered beautifully.
          </h2>

          <p className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">
            Designed to make grocery shopping simple,
            fast and reliable.
          </p>

        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-[28px] border border-[var(--border)] bg-white/80
backdrop-blur-md p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(22,101,52,0.12)] hover:border-[var(--primary)]/20 "
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-light)]">

                  <Icon
                    size={22}
                    className="text-[var(--primary)]"
                  />

                </div>

                <h3 className="mt-6 text-lg font-bold">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  {feature.description}
                </p>

              </div>
            );
          })}

        </div>

      </Container>
    </section>
  );
}