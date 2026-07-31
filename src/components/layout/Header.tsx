import DesktopHeader from "@/components/layout/DesktopHeader";
import MobileHeader from "@/components/layout/MobileHeader";

export default function Header() {
  return (
    <div className="sticky top-0 z-50">
      <DesktopHeader />
      <MobileHeader />
    </div>
  );
}