import OfferBanner from "./OfferBanner";
import OfferCard from "./OfferCard";
import { OFFERS } from "./offerData";


export default function OfferSection() {
  return (
  <section className="relative mt-2">


      <div className="mb-4 flex items-center justify-between">

      
      </div>
<OfferBanner />


<div className="relative z-10 -mt-20 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">

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