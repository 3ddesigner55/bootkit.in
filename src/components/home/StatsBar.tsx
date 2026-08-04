import Container from "@/components/ui/Container";
import {
  Clock3,
  ShoppingBag,
  ShieldCheck,
  MapPin,
} from "lucide-react";

const stats = [
  {
    icon: Clock3,
    title: "10–20 Min",
    subtitle: "Fast Delivery",
  },
  {
    icon: ShoppingBag,
    title: "1000+",
    subtitle: "Daily Essentials",
  },
  {
    icon: ShieldCheck,
    title: "100%",
    subtitle: "Secure Payments",
  },
  {
    icon: MapPin,
    title: "Local",
    subtitle: "Neighbourhood Delivery",
  },
];

export default function StatsBar() {
  return (
    <section className="py-5">
      <Container>
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-center gap-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-light)]">
                  <Icon
                    size={22}
                    className="text-[var(--primary)]"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)]">
                    {item.subtitle}
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