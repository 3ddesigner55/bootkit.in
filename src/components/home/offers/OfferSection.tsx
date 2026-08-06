import OfferCard from "./OfferCard";
import { OFFERS } from "./offerData";

export default function OfferSection() {
  return (
    <section className="mt-2">

      <div className="mb-4 flex items-center justify-between">

        <h2 className="text-lg font-black">
          Exclusive Offers
        </h2>

        

      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">

        {OFFERS.map((offer) => (

          <OfferCard
            key={offer.title}
            title={offer.title}
            subtitle={offer.subtitle}
            color={offer.color}
           
          />

        ))}

      </div>

    </section>
  );
}