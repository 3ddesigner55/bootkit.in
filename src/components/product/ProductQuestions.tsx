"use client";

import { MessageCircleQuestion } from "lucide-react";

type Props = {
  productName: string;
};

const questions = [
  {
    q: "Is this product original?",
    a: "Yes, this is a 100% genuine product supplied by authorized sellers.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery time depends on your selected location. Most orders arrive within the estimated delivery time shown on the product page.",
  },
  {
    q: "Can I return this product?",
    a: "Yes. Damaged or incorrect products are eligible for support according to our return policy.",
  },
  {
    q: "How should I store this product?",
    a: "Please follow the storage instructions mentioned on the product packaging.",
  },
];

export default function ProductQuestions({
  productName,
}: Props) {
  return (
    <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3">
        <MessageCircleQuestion
          className="text-[var(--primary)]"
          size={24}
        />

        <div>
          <h2 className="text-xl font-black">
            Questions & Answers
          </h2>

          <p className="text-sm text-[var(--text-secondary)]">
            Common questions about {productName}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {questions.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-[var(--border)] p-5"
          >
            <p className="font-black">
              Q. {item.q}
            </p>

            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              <span className="font-black text-[var(--primary)]">
                A.
              </span>{" "}
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}