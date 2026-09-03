import Container from "@/components/ui/Container";
import { WEBSITE } from "@/constants/website";
import { Download, ShoppingBasket, Truck } from "lucide-react";

const steps = [
  {
    icon: Download,
    step: "01",
    title: "Download App",
    description:
      "Install BootKiT and create your account in seconds.",
  },
  {
    icon: ShoppingBasket,
    step: "02",
    title: "Choose Products",
    description:
      "Browse groceries, fruits, vegetables and daily essentials.",
  },
  {
    icon: Truck,
    step: "03",
    title: "Get Fast Delivery",
    description:
      "Sit back while we deliver everything to your doorstep.",
  },
];

export default function HowItWorks() {
  return (
    <section className={WEBSITE.section}>
      <Container>

        <div className="mx-auto max-w-2xl text-center">

          <span className="rounded-full bg-[var(--primary-light)] px-4 py-2 text-sm text-[var(--primary)]">
            How It Works
          </span>

          <h2 className="mt-5 text-3xl lg:text-4xl font-bold tracking-tight">
            Three simple steps.
          </h2>

          <p className="mt-4 text-base text-[var(--text-secondary)]">
            Grocery shopping has never been easier.
          </p>

        </div>

        <div className="relative mt-10 grid gap-8 lg:grid-cols-3">

          {steps.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.step}
                className="relative rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5 transition hover:-translate-y-2 hover:shadow-[var(--shadow-lg)]"
              >

                <div className="absolute right-6 top-6 text-5xl font-bold text-[var(--primary-light)]">
                  {item.step}
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">

                  <Icon size={22} />

                </div>

                <h3 className="mt-8 text-lg font-semibold">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                  {item.description}
                </p>

              </div>
            );
          })}

        </div>

      </Container>
    </section>
  );
}