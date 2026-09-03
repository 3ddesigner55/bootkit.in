import Container from "@/components/ui/Container";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Leaf,
  MapPin,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";

import PageHero from "@/components/website/PageHero";
import PageContent from "@/components/website/PageContent";
import InfoCard from "@/components/website/InfoCard";

const stats = [
  {
    value: "10–20",
    label: "Minute Delivery",
  },
  {
    value: "1000+",
    label: "Products",
  },
  {
    value: "Growing",
    label: "Cities",
  },
  {
    value: "24×7",
    label: "Support",
  },
];

const features = [
  {
    icon: Truck,
    title: "Fast Delivery",
    text: "Lightning-fast grocery delivery from nearby stores.",
  },
  {
    icon: Leaf,
    title: "Fresh Products",
    text: "Daily fresh fruits, vegetables and dairy.",
  },
  {
    icon: Store,
    title: "Local Stores",
    text: "Supporting trusted neighbourhood retailers.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    text: "Safe and reliable checkout experience.",
  },
  {
    icon: MapPin,
    title: "Live Tracking",
    text: "Know exactly where your order is.",
  },
  {
    icon: Clock3,
    title: "Always Available",
    text: "Designed for your everyday grocery needs.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative h-[520px] overflow-hidden">

  <Image
    src="/images/about/hero.jpg"
    alt="BootKiT"
    fill
    priority
    className="object-cover"
  />

  <div className="absolute inset-0 bg-black/35" />

  <Container className="relative z-10 flex h-full items-center">

    <div className="max-w-2xl text-white">

      <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
        ABOUT BOOTKIT
      </span>

      <h1 className="mt-6 text-5xl font-black leading-tight lg:text-3xl">
        Making Grocery
        <br />
        Shopping Better.
      </h1>

      <p className="mt-6 text-lg leading-8 text-white/85">
        BootKiT is redefining grocery delivery with
        fresh products, trusted local stores and
        lightning-fast service.
      </p>

    </div>

  </Container>

</section>

      <PageContent>

        {/* Story */}

        <section className="grid items-center gap-12 lg:grid-cols-2">

          <div className="overflow-hidden rounded-[32px]">

            <Image
              src="/images/about/story.jpg"
              alt="BootKiT Story"
              width={500}
              height={500}
              className="h-[520px] object-cover"
            />

          </div>

          <div>

            <span className="text-sm font-semibold text-[var(--primary)]">
              OUR STORY
            </span>

            <h2 className="mt-3 text-4xl font-bold text-[var(--text-primary)]">
              Built for modern Indian families.
            </h2>

            <p className="mt-6 leading-8 text-[var(--text-secondary)]">
              BootKiT was created with one simple mission:
              make grocery shopping effortless.
              We believe customers deserve fresh products,
              transparent pricing and ultra-fast delivery.
            </p>

            <p className="mt-5 leading-8 text-[var(--text-secondary)]">
              We're building a platform where local stores,
              technology and convenience come together to
              deliver an amazing shopping experience.
            </p>

          </div>

        </section>

        {/* Stats */}

        <section>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {stats.map((item) => (

              <div
                key={item.label}
                className="rounded-3xl border border-[var(--border)] bg-white p-5 text-center shadow-[var(--shadow-sm)]"
              >

                <h3 className="text-2xl font-black text-[var(--primary)]">
                  {item.value}
                </h3>

                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  {item.label}
                </p>

              </div>

            ))}

          </div>

        </section>

        {/* Mission */}

        <section className="grid gap-6 lg:grid-cols-3">

          <InfoCard title="Mission">
            Deliver groceries faster while supporting local businesses.
          </InfoCard>

          <InfoCard title="Vision">
            Build India's most trusted hyperlocal grocery platform.
          </InfoCard>

          <InfoCard title="Values">
            Freshness, Speed, Trust and Customer Happiness.
          </InfoCard>

        </section>

        {/* Features */}

        <section>

          <div className="text-center">

            <h2 className="text-4xl font-bold">
              Why BootKiT?
            </h2>

            <p className="mt-4 text-[var(--text-secondary)]">
              Everything is designed around customer convenience.
            </p>

          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {features.map((feature) => {

              const Icon = feature.icon;

              return (

                <div
                  key={feature.title}
                  className="rounded-3xl border border-[var(--border)] bg-white p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
                >

                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--primary-light)]">

                    <Icon
                      className="text-[var(--primary)]"
                    />

                  </div>

                  <h3 className="mt-6 text-xl font-semibold">

                    {feature.title}

                  </h3>

                  <p className="mt-3 leading-7 text-[var(--text-secondary)]">

                    {feature.text}

                  </p>

                </div>

              );

            })}

          </div>

        </section>

        <section>

  <div className="text-center">

    <span className="rounded-full bg-[var(--primary-light)] px-4 py-2 text-sm text-[var(--primary)]">
      OUR JOURNEY
    </span>

    <h2 className="mt-5 text-4xl font-bold text-[var(--text-primary)]">
      Building the Future of Grocery Delivery
    </h2>

    <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
      Every great company starts with a simple idea. Here's how BootKiT is growing.
    </p>

  </div>

  <div className="mt-14 grid gap-8 lg:grid-cols-4">

    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-2xl text-white">
        
      </div>

      <h3 className="mt-5 font-bold text-lg">
        Idea
      </h3>

      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        BootKiT started with the vision of making grocery shopping effortless.
      </p>
    </div>

    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-2xl text-white">
        
      </div>

      <h3 className="mt-5 font-bold text-lg">
        Development
      </h3>

      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Building a modern platform for customers and local stores.
      </p>
    </div>

    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-2xl text-white">
        
      </div>

      <h3 className="mt-5 font-bold text-lg">
        Launch
      </h3>

      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Starting with selected cities and expanding rapidly.
      </p>
    </div>

    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-2xl text-white">
        🌎
      </div>

      <h3 className="mt-5 font-bold text-lg">
        Future
      </h3>

      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Bringing fast grocery delivery to millions of families across India.
      </p>
    </div>

  </div>

</section>
<div className="my-20 h-px bg-[var(--border)]" />
        {/* CTA */}

        <section className="overflow-hidden rounded-[36px] bg-[var(--primary)] px-8 py-14 text-center text-white">

          <h2 className="text-4xl font-bold">
            Experience BootKiT Today
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-white/80">
            Download the BootKiT app and discover a faster,
            fresher and smarter grocery shopping experience.
          </p>

          <Link
            href="#download"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-7 py-3 font-semibold text-primary transition hover:scale-105"
          >

            Download App

            <ArrowRight size={18} />

          </Link>

        </section>

      </PageContent>
    </>
  );
}