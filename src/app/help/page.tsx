import PageHero from "@/components/website/PageHero";
import PageContent from "@/components/website/PageContent";
import InfoCard from "@/components/website/InfoCard";

export default function HelpPage() {
  return (
    <>
      <PageHero
        badge="Help Center"
        title="How can we help you?"
        description="Find answers to common questions and get support for your BootKiT experience."
      />

      <PageContent>

        <InfoCard title="Ordering">
          <p>Orders can be placed only through the BootKiT Android App.</p>
        </InfoCard>

        <InfoCard title="Delivery">
          <p>Most orders are delivered within 10–20 minutes in serviceable areas.</p>
        </InfoCard>

        <InfoCard title="Payments">
          <p>UPI, Debit Card, Credit Card and Cash on Delivery (where available).</p>
        </InfoCard>

        <InfoCard title="Need More Help?">
          <p>Email us at <strong>support@bootkit.in</strong></p>
        </InfoCard>

      </PageContent>
    </>
  );
}