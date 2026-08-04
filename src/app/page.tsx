
import DownloadSection from "@/components/website/DownloadSection";
import WebsiteHeader from "@/components/layout/WebsiteHeader";
import Hero from "@/components/website/Hero";
import Features from "@/components/website/Features";
import AppScreenshots from "@/components/website/AppScreenshots";
import HowItWorks from "@/components/website/HowItWorks";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <WebsiteHeader />

      <main>
        <Hero />
        <Features />
        <AppScreenshots />
        <HowItWorks />
        <DownloadSection />
      </main>
    </div>
  );
}