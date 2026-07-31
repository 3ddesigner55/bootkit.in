type CheckoutStep = 1 | 2 | 3;

type Props = {
  currentStep: CheckoutStep;
};

export default function CheckoutProgress({
  currentStep,
}: Props) {
  const steps = [
    {
      number: 1,
      label: "Delivery Address",
    },
    {
      number: 2,
      label: "Payment",
    },
    {
      number: 3,
      label: "Success",
    },
  ];

  return (
    <section className="mx-auto mb-6 max-w-3xl rounded-2xl border border-[var(--border)] bg-white px-4 py-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start">
        {steps.map((step, index) => {
          const completed = currentStep > step.number;
          const active = currentStep === step.number;

          return (
            <div
              key={step.number}
              className="flex flex-1 items-start"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                    completed || active
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
                  }`}
                >
                  {completed ? "✓" : step.number}
                </div>

                <span
                  className={`mt-2 text-[10px] font-bold sm:text-xs ${
                    completed || active
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-2 mt-[17px] h-0.5 flex-1 ${
                    currentStep > step.number
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--border)]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}