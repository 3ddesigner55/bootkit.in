import Container from "@/components/ui/Container";

export default function PrivacyPolicyPage() {
  return (
    <main className="py-16">
      <Container className="max-w-4xl">

        <h1 className="text-4xl font-bold text-[var(--text-primary)]">
          Privacy Policy
        </h1>

        <p className="mt-4 text-[var(--text-secondary)]">
          Last Updated: August 2026
        </p>

        <div className="mt-10 space-y-8 leading-8 text-[var(--text-secondary)]">

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Introduction
            </h2>

            <p>
              BootKiT respects your privacy. This Privacy Policy explains how
              we collect, use and protect your information when you use our
              website and mobile application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Information We Collect
            </h2>

            <ul className="list-disc pl-6">
              <li>Name</li>
              <li>Phone Number</li>
              <li>Email Address</li>
              <li>Delivery Address</li>
              <li>Order Information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Contact
            </h2>

            <p>
              Email: support@bootkit.in
            </p>

          </section>

        </div>

      </Container>
    </main>
  );
}