import Image from "next/image";
import Container from "@/components/ui/Container";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      {/* Hero */}

      <section className="relative h-[420px] overflow-hidden">

        <Image
          src="/images/contact/hero.jpg"
          alt="Contact BootKiT"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/50" />

        <Container className="relative z-10 flex h-full items-center">

          <div className="max-w-2xl text-white">

            <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
              CONTACT US
            </span>

            <h1 className="mt-6 text-5xl font-black">
              We'd Love
              <br />
              to Hear From You.
            </h1>

            <p className="mt-6 text-lg text-white/85">
              Questions, feedback or business enquiries?
              Our team is always happy to help.
            </p>

          </div>

        </Container>

      </section>
<section className="py-20">
  <Container>

    <div className="grid gap-10 lg:grid-cols-2">

      {/* LEFT */}

      <div>

        <h2 className="text-3xl font-bold text-[var(--text-primary)]">
          Contact Information
        </h2>

        <p className="mt-4 text-[var(--text-secondary)]">
          Reach out to us anytime. We're always happy to help.
        </p>

        <div className="mt-10 space-y-5">

          {/* Email */}

          <div className="flex gap-4 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)]">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-light)]">
              <Mail className="text-[var(--primary)]" />
            </div>

            <div>

              <h3 className="font-semibold">
                Email
              </h3>

              <p className="mt-2 text-[var(--text-secondary)]">
                support@bootkit.in
              </p>

            </div>

          </div>

          {/* Phone */}

          <div className="flex gap-4 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)]">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-light)]">
              <Phone className="text-[var(--primary)]" />
            </div>

            <div>

              <h3 className="font-semibold">
                Phone
              </h3>

              <p className="mt-2 text-[var(--text-secondary)]">
                Coming Soon
              </p>

            </div>

          </div>

          {/* Address */}

          <div className="flex gap-4 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)]">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-light)]">
              <MapPin className="text-[var(--primary)]" />
            </div>

            <div>

              <h3 className="font-semibold">
                Address
              </h3>

              <p className="mt-2 text-[var(--text-secondary)]">
                Rajasthan, India
              </p>

            </div>

          </div>

          {/* Hours */}

          <div className="flex gap-4 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)]">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-light)]">
              <Clock className="text-[var(--primary)]" />
            </div>

            <div>

              <h3 className="font-semibold">
                Support Hours
              </h3>

              <p className="mt-2 text-[var(--text-secondary)]">
                Monday - Sunday
                <br />
                7:00 AM - 11:00 PM
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* RIGHT */}

      <div className="rounded-[32px] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-sm)]">

        <h2 className="text-3xl font-bold">
          Send us a Message
        </h2>

        <p className="mt-4 text-[var(--text-secondary)]">
          Fill out the form and our team will get back to you shortly.
        </p>

        <div className="mt-8 space-y-5">

          <input
            type="text"
            placeholder="Your Name"
            className="w-full rounded-2xl border border-[var(--border)] px-5 py-3 outline-none focus:border-[var(--primary)]"
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full rounded-2xl border border-[var(--border)] px-5 py-3 outline-none focus:border-[var(--primary)]"
          />

          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full rounded-2xl border border-[var(--border)] px-5 py-3 outline-none focus:border-[var(--primary)]"
          />

          <textarea
            rows={6}
            placeholder="Your Message"
            className="w-full rounded-2xl border border-[var(--border)] px-5 py-3 outline-none focus:border-[var(--primary)]"
          />

          <button className="h-12 w-full rounded-2xl bg-[var(--primary)] text-white transition hover:bg-[var(--primary-hover)]">
            Send Message
          </button>

        </div>

      </div>

    </div>

  </Container>
</section>
<section className="py-10">
  <Container>

    <div className="text-center">

      <span className="rounded-full bg-[var(--primary-light)] px-4 py-2 text-sm text-[var(--primary)]">
        QUICK SUPPORT
      </span>

      <h2 className="mt-5 text-4xl font-bold text-[var(--text-primary)]">
        Choose the Right Team
      </h2>

      <p className="mt-4 text-[var(--text-secondary)]">
        We have dedicated teams to help you faster.
      </p>

    </div>

    <div className="mt-12 grid gap-6 md:grid-cols-3">

      <div className="rounded-3xl border border-[var(--border)] bg-white p-8 text-center transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">

        <div className="text-5xl">💬</div>

        <h3 className="mt-5 text-xl font-semibold">
          Customer Support
        </h3>

        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Questions about orders, delivery or your account.
        </p>

      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white p-8 text-center transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">

        <div className="text-5xl">🤝</div>

        <h3 className="mt-5 text-xl font-semibold">
          Business Partnership
        </h3>

        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Partner your grocery store with BootKiT.
        </p>

      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white p-8 text-center transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">

        <div className="text-5xl">🏍️</div>

        <h3 className="mt-5 text-xl font-semibold">
          Delivery Partner
        </h3>

        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Join our growing delivery partner network.
        </p>

      </div>

    </div>

  </Container>
</section>
<section className="pb-20">
  <Container>

    <div className="overflow-hidden rounded-[36px] border border-[var(--border)] bg-[var(--surface-soft)]">

      <div className="flex h-[420px] items-center justify-center">

        <div className="text-center">

          <div className="text-6xl">
            📍
          </div>

          <h2 className="mt-6 text-3xl font-bold">
            Office Location
          </h2>

          <p className="mt-4 text-[var(--text-secondary)]">
            Interactive Google Map will be added
            after the official office address is finalized.
          </p>

        </div>

      </div>

    </div>

  </Container>
</section>  
      {/* बाकी sections अगले step में */}
    </>
  );
}