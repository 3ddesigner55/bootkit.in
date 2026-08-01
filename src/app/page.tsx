

import Link from "next/link";
import AnnouncementBar from "@/components/home/AnnouncementBar";
import HeroSection from "@/components/home/HeroSection";
import HomeCatalog from "@/components/home/HomeCatalog";
import Header from "@/components/layout/Header";
import RecentlyViewed from "@/components/product/recommendations/RecentlyViewed";
import Container from "@/components/ui/Container";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      
      <Container className="py-3">
  <Link
    href="/offers"
    className="flex items-center justify-between gap-4 rounded-[22px] bg-[var(--accent-light)] p-4"
  >
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--warning)]">
        BootKiT offers
      </p>

      <p className="mt-1 text-sm font-black text-[var(--text-primary)]">
        Coupons and special savings
      </p>
    </div>

    <span className="text-xs font-black text-[var(--primary)]">
      View offers →
    </span>
  </Link>
</Container>
      <AnnouncementBar />
      <Header />

      <main>
        <HomeCatalog />
        <HeroSection />
        <RecentlyViewed />
      </main>
    </div>
    
  );
}
