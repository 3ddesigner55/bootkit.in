import Container from "@/components/ui/Container";
import { WEBSITE } from "@/constants/website";
import Image from "next/image";

const screens = [
  {
    title: "Products",
    desc: "Browse thousands of groceries.",
    image: "/images/app/products.png",
  },
  {
    title: "Categories",
    desc: "Find products in seconds.",
    image: "/images/app/categories.png", // अभी यही रहने दो
  },
  {
    title: "Cart",
    desc: "Fast and secure checkout.",
    image: "/images/app/cart.png",
  },
];

export default function AppScreenshots() {
  return (
    <section className={WEBSITE.section}>
      <Container>

        <div className="mx-auto max-w-2xl text-center">

          <span className="rounded-full bg-[var(--primary-light)] px-4 py-2 text-sm text-[var(--primary)]">
            App Preview
          </span>

          <h2 className="mt-5 text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Beautiful experience,
            <br />
            inside the BootKiT App.
          </h2>

          <p className="mt-5 text-base text-[var(--text-secondary)]">
            Everything is designed for speed, simplicity and convenience.
          </p>

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {screens.map((screen) => (
            <div
              key={screen.title}
              className="group text-center"
            >

              <div className="mx-auto flex h-[390px] w-[200px] items-center justify-center rounded-[28px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-lg)] transition duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">

                <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-[var(--surface-soft)]">

                  {/* Replace with real app screenshot later */}

                  <Image
  src={screen.image}
  alt={screen.title}
  width={215}
  height={430}
  className="h-full w-full rounded-[18px] object-cover"
/>

                </div>

              </div>

              <h3 className="mt-8 text-lg font-semibold">
                {screen.title}
              </h3>

              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                {screen.desc}
              </p>

            </div>
          ))}

        </div>

        

      </Container>
    </section>
  );
}