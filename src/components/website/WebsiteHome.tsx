import WebsiteHeader from "@/components/layout/WebsiteHeader";
import Hero from "@/components/website/Hero";
import Features from "@/components/website/Features";
import AppScreenshots from "@/components/website/AppScreenshots";
import HowItWorks from "@/components/website/HowItWorks";
import DownloadSection from "@/components/website/DownloadSection";
import Footer from "@/components/website/Footer";

export default function WebsiteHome() {
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

      <Footer />
    </div>
  );
}