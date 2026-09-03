import Container from "@/components/ui/Container";

type PageHeroProps = {
  badge: string;
  title: string;
  description: string;
};

export default function PageHero({
  badge,
  title,
  description,
}: PageHeroProps) {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--surface-soft)] py-16 lg:py-20">
      <Container className="max-w-5xl">

        <span className="inline-flex rounded-full bg-[var(--primary-light)] px-4 py-2 text-sm text-[var(--primary)]">
          {badge}
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-[var(--text-primary)] lg:text-5xl">
          {title}
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">
          {description}
        </p>

      </Container>
    </section>
  );
}