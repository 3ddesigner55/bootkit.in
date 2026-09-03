import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-6">

      <div className="max-w-xl text-center">

        <div className="text-8xl">
          🛒
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
          Error 404
        </p>

        <h1 className="mt-3 text-5xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
          Page Not Found
        </h1>

        <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-7 py-3 font-semibold text-white transition hover:bg-[var(--primary-hover)]"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

      </div>

    </main>
  );
}