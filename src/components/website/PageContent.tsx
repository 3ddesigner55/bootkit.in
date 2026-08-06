import { ReactNode } from "react";
import Container from "@/components/ui/Container";

type PageContentProps = {
  children: ReactNode;
};

export default function PageContent({
  children,
}: PageContentProps) {
  return (
    <section className="py-14 lg:py-20">
      <Container className="max-w-5xl">
        <div className="space-y-10">
          {children}
        </div>
      </Container>
    </section>
  );
}