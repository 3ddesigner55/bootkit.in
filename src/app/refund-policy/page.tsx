import PageHero from "@/components/website/PageHero";
import PageContent from "@/components/website/PageContent";
import InfoCard from "@/components/website/InfoCard";

export default function RefundPolicyPage() {
  return (
    <>
      <PageHero
        badge="Refunds"
        title="Return & Refund Policy"
        description="Our refund process is simple and transparent."
      />

      <PageContent>

        <InfoCard title="Damaged or Incorrect Products">
          <p>If you receive a damaged or incorrect item, contact support within 24 hours.</p>
        </InfoCard>

        <InfoCard title="Refund Timeline">
          <p>Approved refunds are processed within 5–7 business days.</p>
        </InfoCard>

        <InfoCard title="Support">
          <p>For refund assistance, contact support@bootkit.in.</p>
        </InfoCard>

      </PageContent>
    </>
  );
}