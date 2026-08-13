import OfferBanner from "./OfferBanner";
import OfferCard from "./OfferCard";
import { OFFERS } from "./offerData";

export interface OfferItem {
  title: string;
  subtitle: string;
  color?: string;
}

interface OfferSectionProps {
  offers?: OfferItem[];
}

export default function OfferSection({ offers: initialOffers }: OfferSectionProps = {}) {
  const isDynamicMode = initialOffers !== undefined;

  if (isDynamicMode && (!initialOffers || initialOffers.length === 0)) {
    return null;
  }

  const activeOffers = isDynamicMode ? initialOffers : OFFERS;

  if (!activeOffers || activeOffers.length === 0) {
    return null;
  }

  return (
    <section className="relative mt-2">
      <div className="mb-4 flex items-center justify-between" />
      <OfferBanner />

      <div className="relative z-10 -mt-20 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {activeOffers.map((offer) => (
          <OfferCard
            key={offer.title}
            title={offer.title}
            subtitle={offer.subtitle}
            color={offer.color || "bg-emerald-50 text-emerald-900 border-emerald-200"}
          />
        ))}
      </div>
    </section>
  );
}