import Link from "next/link";
import { Download, Smartphone } from "lucide-react";
import Container from "@/components/ui/Container";

export default function AppDownloadBanner() {
  return (
    <section className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] py-5">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-white p-6 shadow-xl md:flex-row">

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
              <Smartphone className="h-8 w-8 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Download BootKiT App
              </h2>

              <p className="mt-2 text-gray-600">
                Faster ordering, live tracking, exclusive offers and instant
                grocery delivery.
              </p>
            </div>
          </div>

          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-7 py-4 text-base font-bold text-white transition hover:bg-green-700"
          >
            <Download size={22} />
            Download App
          </Link>

        </div>
      </Container>
    </section>
  );
}