import Link from "next/link";
import {
  ArrowRight,
  Download,
  Gift,
  ShieldCheck,
} from "lucide-react";
import Container from "@/components/ui/Container";

const offers = [
  {
    icon: Gift,
    title: "Welcome Offer",
    description: "Get exciting offers on your first grocery order.",
    button: "Order Now",
    href: "/categories",
    color: "bg-[#ECFDF3]",
    iconColor: "text-[#16A34A]",
  },
  {
    icon: Download,
    title: "Download BootKiT App",
    description:
      "Enjoy faster checkout, exclusive app-only deals and live tracking.",
    button: "Download App",
    href: "#",
    color: "bg-[#EEF4FF]",
    iconColor: "text-[#2563EB]",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description:
      "UPI, Cards, Wallet and Cash on Delivery available.",
    button: "Learn More",
    href: "/help",
    color: "bg-[#FFF7E8]",
    iconColor: "text-[#F59E0B]",
  },
];

export default function OfferBanner() {
  return (
    <section className="py-8">
      <Container>
        <div className="grid gap-4 lg:grid-cols-3">
          {offers.map((offer) => {
            const Icon = offer.icon;

            return (
              <div
                key={offer.title}
                className="group rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${offer.color}`}
                >
                  <Icon
                    className={offer.iconColor}
                    size={28}
                  />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
                  {offer.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {offer.description}
                </p>

                <Link
                  href={offer.href}
                  className="mt-6 inline-flex items-center gap-2 font-medium text-[var(--primary)] transition group-hover:gap-3"
                >
                  {offer.button}

                  <ArrowRight size={17} />
                </Link>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}