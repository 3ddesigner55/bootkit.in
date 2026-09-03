import Link from "next/link";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface-soft)]">
      <Container>

        <div className="grid gap-10 py-14 md:grid-cols-3">

          {/* Brand */}

          <div>
            <Logo />

            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              BootKiT is building the fastest grocery delivery experience,
              starting with Android.
            </p>
          </div>

          
          {/* Contact */}

          <div>

            <h3 className="text-base font-semibold">
              Contact
            </h3>

            <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">

              <p>support@bootkit.in</p>

              <p>Launching soon across India.</p>

            </div>

          </div>

        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] py-6 text-sm text-[var(--text-muted)] md:flex-row">

          <p>
            © 2026 BootKiT. All rights reserved.
          </p>

          <div className="flex gap-5">

            <Link href="#">
              Privacy
            </Link>

            <Link href="#">
              Terms
            </Link>

          </div>

        </div>

      </Container>
    </footer>
  );
}