import PageHero from "@/components/website/PageHero";
import PageContent from "@/components/website/PageContent";
import InfoCard from "@/components/website/InfoCard";

export default function ShippingPolicyPage() {
  return (
    <>
      <PageHero
        badge="Shipping"
        title="Shipping Policy"
        description="Fast and reliable delivery for every order."
      />

      <PageContent>

        <InfoCard title="Delivery Time">
          <p>Typical delivery time is between 10–20 minutes depending on location and traffic.</p>
        </InfoCard>

        <InfoCard title="Service Availability">
          <p>Delivery is available only in selected service areas.</p>
        </InfoCard>

        <InfoCard title="Delivery Charges">
          <p>Delivery fees may vary based on order value and distance.</p>
        </InfoCard>

      </PageContent>
    </>
  );
}