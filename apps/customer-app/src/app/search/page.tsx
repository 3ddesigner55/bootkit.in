import { Suspense } from "react";
import SearchResults from "@/components/search/SearchResults";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchResults />
    </Suspense>
  );
}

function SearchLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <Container className="py-5">
        <div className="h-[52px] animate-pulse rounded-2xl bg-white" />

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-[290px] animate-pulse rounded-[20px] bg-white"
            />
          ))}
        </div>
      </Container>
    </div>
  );
}