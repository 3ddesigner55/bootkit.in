import PageHero from "@/components/website/PageHero";
import PageContent from "@/components/website/PageContent";
import InfoCard from "@/components/website/InfoCard";

export default function TermsPage() {
  return (
    <>
      <PageHero
        badge="Legal"
        title="Terms & Conditions"
        description="Please read these terms before using BootKiT."
      />

      <PageContent>

        <InfoCard title="Use of Service">
          <p>By using BootKiT, you agree to comply with our policies and applicable laws.</p>
        </InfoCard>

        <InfoCard title="Orders">
          <p>All orders are subject to product availability and service area coverage.</p>
        </InfoCard>

        <InfoCard title="Accounts">
          <p>Users are responsible for maintaining the confidentiality of their account information.</p>
        </InfoCard>

      </PageContent>
    </>
  );
}