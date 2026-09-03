import Link from "next/link";
import {
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";

const companyLinks = [
  {
    label: "About BootKiT",
    href: "/about",
  },
  {
    label: "Contact us",
    href: "/contact",
  },
  {
    label: "Careers",
    href: "/careers",
  },
  {
    label: "Become a delivery partner",
    href: "/delivery-partner",
  },
];

const customerLinks = [
  {
    label: "Download App",
    href: "#download",
  },
  {
    label: "Help Center",
    href: "/help",
  },
  {
    label: "FAQs",
    href: "#faq",
  },
  {
    label: "Delivery Areas",
    href: "#",
  },
];

const legalLinks = [
  {
    label: "Privacy Policy",
    href: "/privacy-policy",
  },
  {
    label: "Terms & Conditions",
    href: "/terms",
  },
  {
    label: "Return Policy",
    href: "/refund-policy",
  },
  {
    label: "Shipping Policy",
    href: "/shipping-policy",
  },
];
export default function Footer() {
  const year = new Date().getFullYear();

  return (
<footer className="mt-10 border-t border-[var(--border)] bg-white">
        <Container>
        <div className="grid gap-10 py-12 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr]">
          <div>
            <Logo />

            <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              BootKiT brings groceries, fresh produce and everyday essentials
              from nearby stores directly to your doorstep.
            </p>

            <div className="mt-6 space-y-3">
              <a
                href="tel:+910000000000"
                className="flex items-center gap-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--primary)]">
                  <Phone size={16} />
                </span>

                +91 8000093300
              </a>

              <a
                href="mailto:support@bootkit.local"
                className="flex items-center gap-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--primary)]">
                  <Mail size={16} />
                </span>

                support@bootkit.in
              </a>

              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--primary)]">
                  <MapPin size={16} />
                </span>

                Serving selected local city areas
              </div>
            </div>
          </div>

          <FooterColumn
            title="Company"
            links={companyLinks}
          />

          <FooterColumn
            title="Customer"
            links={customerLinks}
          />

          <FooterColumn
            title="Legal"
            links={legalLinks}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-[var(--border)] py-6">
          <FooterFeature
            icon={Clock3}
            title="Fast delivery"
            description="10–20 minutes in selected areas"
          />

          <FooterFeature
            icon={ShieldCheck}
            title="Quality checked"
            description="Fresh and trusted products"
          />

          <FooterFeature
            icon={Truck}
            title="Local service"
            description="Orders fulfilled near your location"
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-[var(--border)] py-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} BootKiT. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <span>Made for fast local delivery</span>

            <a
              href="#"
              aria-label="BootKiT Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
             <span className="text-xs font-bold">Instagram</span>
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

type FooterColumnProps = {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

function FooterColumn({
  title,
  links,
}: FooterColumnProps) {
  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-[0.08em] text-[var(--text-primary)]">
        {title}
      </h2>

      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type FooterFeatureProps = {
  icon: typeof Clock3;
  title: string;
  description: string;
};

function FooterFeature({
  icon: Icon,
  title,
  description,
}: FooterFeatureProps) {
  return (
    <div className="flex items-center justify-center gap-3 border-r border-[var(--border)] last:border-r-0">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
        <Icon size={18} />
      </span>

      <div>
        <p className="text-sm font-black text-[var(--text-primary)]">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}