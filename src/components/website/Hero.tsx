import Image from "next/image";
import { WEBSITE } from "@/constants/website";
import Link from "next/link";
import { Download, ShieldCheck, Truck, Leaf } from "lucide-react";
import Container from "@/components/ui/Container";

export default function Hero() {
  return (
    <section className={WEBSITE.section}>

      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">

          {/* LEFT */}

          <div>

            <span className={WEBSITE.badge}>
    ⚡ 10–20 Minute Delivery
</span>

            <h1 className={WEBSITE.title}>
              Fast Grocery,
              Delivery,
              <br />
              Made Beautiful.
            </h1>

            <p className={WEBSITE.subtitle + " max-w-lg"}>
              Fresh groceries, fruits, vegetables and daily essentials delivered quickly through the BootKiT app.
            </p>

            <Link
              href="#"
              className={WEBSITE.button + " mt-8 gap-3"}
            >
              <Download size={20} />

              Download App
            </Link>

            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Available soon on Google Play.
            </p>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-[var(--text-secondary)]">

              <div className="flex items-center gap-2">
                <Truck
                  size={18}
                  className="text-[var(--primary)]"
                />

                <span className="text-sm">
                  Fast Delivery
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Leaf
                  size={18}
                  className="text-[var(--primary)]"
                />

                <span className="rounded-full bg-[var(--surface-soft)] px-4 py-2">
    🥬 Fresh
  </span>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={18}
                  className="text-[var(--primary)]"
                />

                <span className="rounded-full bg-[var(--surface-soft)] px-4 py-2">
    🔒 Secure
  </span>
              </div>

            </div>

          </div>

          {/* RIGHT */}

          {/* RIGHT */}

<div className="relative hidden items-center justify-center lg:flex">

  {/* Background Glow */}

  <div className="absolute h-[480px] w-[480px] rounded-full bg-[var(--primary-light)] blur-3xl opacity-70" />

  {/* Product Screen */}

  <div className="relative z-20 float-slow overflow-hidden rounded-[34px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-lg)] rotate-[-8deg]">
    <Image
      src="/images/app/products.png"
      alt="BootKiT Products"
      width={260}
      height={560}
      className="rounded-[24px]"
      priority
    />

  </div>

  {/* Cart Screen */}

  <div className="absolute bottom-0 right-0 z-30 float-fast overflow-hidden rounded-[34px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-lg)] rotate-[8deg]">

    <Image
      src="/images/app/cart.png"
      alt="BootKiT Cart"
      width={240}
      height={520}
      className="rounded-[24px]"
    />
</div>
  </div>

</div>
      </Container>
      
    </section>
    
  );
}