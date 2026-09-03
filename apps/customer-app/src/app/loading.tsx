export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">

      <div className="text-center">

        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--primary)]" />

        <h2 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
          BootKiT
        </h2>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Loading...
        </p>

      </div>

    </main>
  );
}