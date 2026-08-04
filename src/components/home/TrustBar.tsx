import Container from "@/components/ui/Container";
import {
  Clock3,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";

const items = [
  {
    icon: Clock3,
    title: "10–20 Min Delivery",
  },
  {
    icon: Truck,
    title: "Fresh Everyday",
  },
  {
    icon: ShieldCheck,
    title: "100% Secure Payments",
  },
  {
    icon: Wallet,
    title: "Cash on Delivery",
  },
];

export default function TrustBar() {
  return (
    <section className="py-6">
      <Container>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-light)]">
                  <Icon
                    className="text-[var(--primary)]"
                    size={22}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}