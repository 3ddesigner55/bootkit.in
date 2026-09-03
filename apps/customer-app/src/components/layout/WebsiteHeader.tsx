import Link from "next/link";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";
import { Download } from "lucide-react";

export default function WebsiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/80 backdrop-blur-2xl">
      <Container className="flex h-16 lg:h-20 items-center justify-between">

        <Logo className="scale-110" />

        <nav className="hidden items-center gap-8 text-sm lg:flex">

          <Link
            href="#features"
            className="relative text-[var(--text-secondary)] transition duration-300 hover:text-[var(--primary)]"
          >
            Features
          </Link>

          <Link
            href="#screens"
            className="relative text-[var(--text-secondary)] transition duration-300 hover:text-[var(--primary)]"
          >
            Screens
          </Link>

          <Link
            href="#how"
            className="relative text-[var(--text-secondary)] transition duration-300 hover:text-[var(--primary)]"
          >
            How it Works
          </Link>

          <Link
            href="#faq"
            className="relative text-[var(--text-secondary)] transition duration-300 hover:text-[var(--primary)]"
          >
            FAQ
          </Link>

        </nav>

        <Link
          href="#download" 
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-5 text-sm text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"        >
          <Download size={18} />

          Download Now
        </Link>

      </Container>
    </header>
  );
}