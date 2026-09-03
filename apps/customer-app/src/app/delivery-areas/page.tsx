import PageHero from "@/components/website/PageHero";
import PageContent from "@/components/website/PageContent";
import InfoCard from "@/components/website/InfoCard";

export default function DeliveryAreasPage() {
  return (
    <>
      <PageHero
        badge="Delivery Areas"
        title="Where BootKiT Delivers"
        description="We're expanding city by city to provide fast grocery delivery."
      />

      <PageContent>

        <InfoCard title="Available Cities">
          <p>Launching soon in selected cities across Rajasthan.</p>
        </InfoCard>

        <InfoCard title="Coming Soon">
          <ul className="list-disc pl-5 space-y-2">
            <li>Jaipur</li>
            <li>Jodhpur</li>
            <li>Bikaner</li>
            <li>Udaipur</li>
          </ul>
        </InfoCard>

      </PageContent>
    </>
  );
}