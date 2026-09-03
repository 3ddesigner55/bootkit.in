import { Download } from "lucide-react";
import Container from "@/components/ui/Container";
import { WEBSITE } from "@/constants/website";

export default function DownloadSection() {
  return (
   <section className={WEBSITE.section}>
      <Container>

        <div className="overflow-hidden rounded-[32px] bg-[var(--primary)] px-8 py-12 text-center text-white lg:px-16">

          <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm">
            🚀 Coming Soon
          </span>

          <h2 className="mt-5 text-3xl lg:text-4xl">
            Download BootKiT
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80">
            Experience fast grocery delivery with a beautiful shopping experience.
          </p>

          <button
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[var(--primary)] transition hover:scale-105"
          >
            <Download size={20} />

            Download App
          </button>

          <p className="mt-4 text-sm text-white/70">
            Available soon on Google Play
          </p>

        </div>

      </Container>
    </section>
  );
}