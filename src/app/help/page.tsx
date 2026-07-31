"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";

type HelpCategory = {
  id: string;
  title: string;
  description: string;
  icon: typeof Package;
};

type FAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

const helpCategories: HelpCategory[] = [
  {
    id: "orders",
    title: "Orders",
    description: "Order status, cancellation and reorder",
    icon: Package,
  },
  {
    id: "delivery",
    title: "Delivery",
    description: "Delivery time, location and missing items",
    icon: Truck,
  },
  {
    id: "payments",
    title: "Payments",
    description: "COD, UPI and payment verification",
    icon: WalletCards,
  },
  {
    id: "account",
    title: "Account",
    description: "Profile, saved address and privacy",
    icon: ShieldCheck,
  },
];

const faqs: FAQ[] = [
  {
    id: "faq-order-status",
    category: "orders",
    question: "How can I check my order status?",
    answer:
      "Open My Orders from your account and select the order. The current status and complete tracking timeline will be displayed.",
  },
  {
    id: "faq-cancel-order",
    category: "orders",
    question: "Can I cancel my order?",
    answer:
      "An order can be cancelled while its status is Placed. Open the order details page and tap Cancel order.",
  },
  {
    id: "faq-reorder",
    category: "orders",
    question: "How do I reorder previous items?",
    answer:
      "Open a previous order and tap Reorder items. Available products will be added back to your cart.",
  },
  {
    id: "faq-delivery-time",
    category: "delivery",
    question: "How long does delivery take?",
    answer:
      "Delivery time depends on your selected area and local availability. The estimated time is shown before checkout.",
  },
  {
    id: "faq-location",
    category: "delivery",
    question: "Where is BootKiT currently available?",
    answer:
      "BootKiT is currently available for selected areas under pincode 331403 in Sardarshahar.",
  },
  {
    id: "faq-missing-item",
    category: "delivery",
    question: "What should I do if an item is missing?",
    answer:
      "Keep your order number ready and contact BootKiT support using the options shown below.",
  },
  {
    id: "faq-cod",
    category: "payments",
    question: "Is Cash on Delivery available?",
    answer:
      "Yes. Select Cash on Delivery during checkout and pay when your order arrives.",
  },
  {
    id: "faq-upi",
    category: "payments",
    question: "How does manual UPI payment work?",
    answer:
      "Send payment to the UPI ID shown during checkout and enter the UTR or transaction number for verification.",
  },
  {
    id: "faq-address",
    category: "account",
    question: "How do I save a delivery address?",
    answer:
      "Open Account, select Saved Addresses and add your complete address, pincode and ward or area.",
  },
  {
    id: "faq-local-data",
    category: "account",
    question: "Where is my information stored?",
    answer:
      "During local development, profile, cart, orders and addresses remain stored in this browser on your device.",
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const visibleFaqs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return faqs.filter((faq) => {
      const categoryMatches =
        selectedCategory === "all" ||
        faq.category === selectedCategory;

      const queryMatches =
        !normalizedQuery ||
        faq.question.toLowerCase().includes(normalizedQuery) ||
        faq.answer.toLowerCase().includes(normalizedQuery);

      return categoryMatches && queryMatches;
    });
  }, [query, selectedCategory]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-5 flex items-center gap-3">
            <Link
              href="/account"
              aria-label="Back to account"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                Help & Support
              </h1>

              <p className="text-xs text-[var(--text-muted)]">
                Get help with orders, delivery and payments
              </p>
            </div>
          </div>

          <section className="overflow-hidden rounded-[26px] bg-[var(--primary)] px-5 py-7 text-white shadow-[var(--shadow-md)] sm:px-8 sm:py-9">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-white/15">
                <Headphones size={27} />
              </span>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">
                  BootKiT Support
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                  How can we help?
                </h2>

                <p className="mt-2 max-w-xl text-xs leading-5 text-white/75 sm:text-sm">
                  Search common questions or contact our local support team.
                </p>
              </div>
            </div>

            <label className="mt-6 flex h-12 items-center gap-3 rounded-2xl bg-white px-4 text-[var(--text-primary)]">
              <Search
                size={18}
                className="shrink-0 text-[var(--primary)]"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your question"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
              />
            </label>
          </section>

          <section className="mt-5">
            <h2 className="text-lg font-black text-[var(--text-primary)]">
              Help categories
            </h2>

            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {helpCategories.map((category) => {
                const Icon = category.icon;
                const selected = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategory((current) =>
                        current === category.id ? "all" : category.id
                      )
                    }
                    className={`rounded-[20px] border p-4 text-left transition ${
                      selected
                        ? "border-[var(--primary)] bg-[var(--primary-light)]"
                        : "border-[var(--border)] bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--surface-soft)] text-[var(--primary)]"
                      }`}
                    >
                      <Icon size={19} />
                    </span>

                    <h3 className="mt-3 text-sm font-black text-[var(--text-primary)]">
                      {category.title}
                    </h3>

                    <p className="mt-1 text-[10px] leading-4 text-[var(--text-muted)]">
                      {category.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-6 rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)]">
                  Frequently asked questions
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {visibleFaqs.length} answers available
                </p>
              </div>

              {selectedCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className="text-xs font-black text-[var(--primary)]"
                >
                  View all
                </button>
              )}
            </div>

            {visibleFaqs.length > 0 ? (
              <div className="mt-5 divide-y divide-[var(--border)]">
                {visibleFaqs.map((faq) => {
                  const open = openFaqId === faq.id;

                  return (
                    <div key={faq.id} className="py-1">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaqId(open ? null : faq.id)
                        }
                        className="flex w-full items-center justify-between gap-4 py-4 text-left"
                      >
                        <span className="text-sm font-black leading-5 text-[var(--text-primary)]">
                          {faq.question}
                        </span>

                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-[var(--text-muted)] transition ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {open && (
                        <p className="pb-4 pr-8 text-xs leading-6 text-[var(--text-secondary)]">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <Search
                  size={30}
                  className="text-[var(--text-muted)]"
                />

                <h3 className="mt-4 text-base font-black text-[var(--text-primary)]">
                  No matching help found
                </h3>

                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Try a different question or contact support.
                </p>
              </div>
            )}
          </section>

          <section className="mt-5 rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
            <h2 className="text-lg font-black text-[var(--text-primary)]">
              Contact support
            </h2>

            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Include your order number when contacting us about an order.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href="tel:+910000000000"
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4 transition active:bg-[var(--surface-soft)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--primary-light)] text-[var(--primary)]">
                  <Phone size={20} />
                </span>

                <span>
                  <span className="block text-sm font-black text-[var(--text-primary)]">
                    Call support
                  </span>

                  <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                    +91 00000 00000
                  </span>
                </span>
              </a>

              <a
                href="mailto:support@bootkit.local"
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4 transition active:bg-[var(--surface-soft)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--primary-light)] text-[var(--primary)]">
                  <Mail size={20} />
                </span>

                <span>
                  <span className="block text-sm font-black text-[var(--text-primary)]">
                    Email support
                  </span>

                  <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                    support@bootkit.local
                  </span>
                </span>
              </a>

              <a
                href="https://wa.me/910000000000"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4 transition active:bg-[var(--surface-soft)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-green-50 text-[var(--success)]">
                  <MessageCircle size={20} />
                </span>

                <span>
                  <span className="block text-sm font-black text-[var(--text-primary)]">
                    WhatsApp
                  </span>

                  <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                    Chat with local support
                  </span>
                </span>
              </a>

              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4 text-left"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--primary-light)] text-[var(--primary)]">
                  <MapPin size={20} />
                </span>

                <span>
                  <span className="block text-sm font-black text-[var(--text-primary)]">
                    Service area
                  </span>

                  <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                    Sardarshahar · 331403
                  </span>
                </span>
              </button>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}