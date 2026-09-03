import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import {
  ArrowRight,
  Briefcase,
  HeartHandshake,
  MapPin,
  Rocket,
  TrendingUp,
} from "lucide-react";

const benefits = [
  {
    icon: Rocket,
    title: "Fast Growing Startup",
    text: "Work on products that reach thousands of customers.",
  },
  {
    icon: TrendingUp,
    title: "Career Growth",
    text: "Learn new technologies and grow your career quickly.",
  },
  {
    icon: HeartHandshake,
    title: "Amazing Culture",
    text: "Friendly team, open communication and ownership.",
  },
  {
    icon: Briefcase,
    title: "Real Impact",
    text: "Every contribution helps build BootKiT.",
  },
];

const jobs = [
  {
    title: "Frontend Developer",
    location: "Remote / Jaipur",
    type: "Full Time",
  },
  {
    title: "Android Developer",
    location: "Remote / Jaipur",
    type: "Full Time",
  },
  {
    title: "Customer Support Executive",
    location: "Jaipur",
    type: "Full Time",
  },
  {
    title: "Operations Executive",
    location: "Jaipur",
    type: "Full Time",
  },
];

export default function CareersPage() {
  return (
    <>
      {/* HERO */}

      <section className="relative h-[430px] overflow-hidden">

        <Image
          src="/images/careers/hero.jpg"
          alt="Careers at BootKiT"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/45" />

        <Container className="relative z-10 flex h-full items-center">

          <div className="max-w-2xl text-white">

            <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
              CAREERS
            </span>

            <h1 className="mt-6 text-5xl font-black leading-tight">
              Build the Future
              <br />
              with BootKiT.
            </h1>

            <p className="mt-6 text-lg text-white/90">
              Join our mission to build India's next generation grocery delivery
              platform.
            </p>

          </div>

        </Container>

      </section>

      {/* WHY JOIN */}

      <section className="py-20">

        <Container>

          <div className="text-center">

            <h2 className="text-4xl font-bold text-[var(--text-primary)]">
              Why Join BootKiT?
            </h2>

            <p className="mt-4 text-[var(--text-secondary)]">
              Grow your career while building products customers love.
            </p>

          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            {benefits.map((item) => {

              const Icon = item.icon;

              return (

                <div
                  key={item.title}
                  className="rounded-3xl border border-[var(--border)] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-light)]">

                    <Icon className="text-[var(--primary)]" />

                  </div>

                  <h3 className="mt-6 text-xl font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    {item.text}
                  </p>

                </div>

              );

            })}

          </div>

        </Container>

      </section>

      {/* OPEN POSITIONS */}

      <section className="pb-20">

        <Container>

          <div className="text-center">

            <h2 className="text-4xl font-bold">
              Open Positions
            </h2>

            <p className="mt-4 text-[var(--text-secondary)]">
              Find the role that fits you.
            </p>

          </div>

          <div className="mt-12 space-y-5">

            {jobs.map((job) => (

              <div
                key={job.title}
                className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-[var(--border)] bg-white p-7 shadow-sm transition hover:border-[var(--primary)] hover:shadow-lg md:flex-row md:items-center"
              >

                <div>

                  <h3 className="text-xl font-bold">
                    {job.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">

                    <span className="flex items-center gap-2">
                      <MapPin size={16} />
                      {job.location}
                    </span>

                    <span>
                      {job.type}
                    </span>

                  </div>

                </div>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-white transition hover:bg-[var(--primary-hover)]"
                >

                  Apply Now

                  <ArrowRight size={18} />

                </Link>

              </div>

            ))}

          </div>

        </Container>

      </section>

      {/* HIRING PROCESS */}

      <section className="bg-[var(--surface-soft)] py-20">

        <Container>

          <div className="text-center">

            <h2 className="text-4xl font-bold">
              Hiring Process
            </h2>

          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-4">

            {[
              "Apply",
              "Interview",
              "Technical Round",
              "Welcome",
            ].map((step, index) => (

              <div
                key={step}
                className="text-center"
              >

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-2xl font-bold text-white">
                  {index + 1}
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  {step}
                </h3>

              </div>

            ))}

          </div>

        </Container>

      </section>

      {/* CTA */}

      <section className="py-20">

        <Container>

          <div className="rounded-[36px] bg-[var(--primary)] px-10 py-16 text-center text-white">

            <h2 className="text-4xl font-bold">
              Don't See Your Role?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-white/85">
              We're always looking for talented people.
              Send your resume and we'll get in touch.
            </p>

            <a
              href="mailto:careers@bootkit.in"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-8 py-3 font-semibold text-[var(--primary)] transition hover:scale-105"
            >
              careers@bootkit.in
            </a>

          </div>

        </Container>

      </section>
    </>
  );
}