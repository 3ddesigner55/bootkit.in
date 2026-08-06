import WebsiteHome from "@/components/website/WebsiteHome";
import AppHome from "@/components/home/AppHome";

export default function Home() {
  return (
    <>
      {/* Mobile View */}

      <div className="block lg:hidden">
        <AppHome />
      </div>

      {/* Desktop View */}

      <div className="hidden lg:block">
        <WebsiteHome />
      </div>
    </>
  );
}
