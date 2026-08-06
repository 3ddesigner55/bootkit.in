import PageHero from "@/components/website/PageHero";
import PageContent from "@/components/website/PageContent";
import InfoCard from "@/components/website/InfoCard";

export default function DeliveryPartnerPage() {
  return (
    <>
      <PageHero
        badge="Delivery Partner"
        title="Become a BootKiT Delivery Partner"
        description="Earn by delivering groceries in your city with flexible working hours and weekly payouts."
      />

      <PageContent>

        <InfoCard title="Why Join BootKiT?">
          <ul className="list-disc space-y-2 pl-5">
            <li>Flexible working hours.</li>
            <li>Weekly payouts.</li>
            <li>Performance incentives.</li>
            <li>Work close to your location.</li>
          </ul>
        </InfoCard>

        <InfoCard title="Requirements">
          <ul className="list-disc space-y-2 pl-5">
            <li>Valid Driving License.</li>
            <li>Two-wheeler with RC & Insurance.</li>
            <li>Android Smartphone.</li>
            <li>Government ID Proof.</li>
          </ul>
        </InfoCard>

        <InfoCard title="Apply">
          <p>
            Interested in joining BootKiT?
          </p>

          <p className="mt-3 font-semibold text-[var(--primary)]">
            partner@bootkit.in
          </p>

          <button className="mt-6 rounded-xl bg-[var(--primary)] px-6 py-3 text-white transition hover:bg-[var(--primary-hover)]">
            Apply Now
          </button>
        </InfoCard>

      </PageContent>
    </>
  );
}