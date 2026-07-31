import { Clock3, ShieldCheck, Truck } from "lucide-react";

const highlights = [
  {
    icon: Clock3,
    text: "Fast delivery in selected city areas",
  },
  {
    icon: ShieldCheck,
    text: "Fresh and quality-checked products",
  },
  {
    icon: Truck,
    text: "Free delivery on eligible orders",
  },
];

export default function AnnouncementBar() {
  return (
    <section className="border-b border-white/10 bg-[var(--primary)] text-white">
      <div className="site-container">
        <div className="flex min-h-9 items-center justify-center overflow-hidden">
          <div className="flex items-center gap-6 whitespace-nowrap text-[11px] font-semibold sm:text-xs lg:gap-10">
            {highlights.map(({ icon: Icon, text }, index) => (
              <div
                key={text}
                className={`flex items-center gap-1.5 ${
                  index > 0 ? "hidden sm:flex" : ""
                }`}
              >
                <Icon size={14} strokeWidth={2.2} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}