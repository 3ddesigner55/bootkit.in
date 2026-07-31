"use client";

import {
  CheckCircle2,
  MessageSquare,
  Send,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useAccount } from "@/hooks/useAccount";
import { useReviews } from "@/hooks/useReviews";

type ProductReviewsProps = {
  productId: string;
};

export default function ProductReviews({
  productId,
}: ProductReviewsProps) {
  const { profile, hydrated: accountHydrated } = useAccount();

  const {
    hydrated,
    addReview,
    removeReview,
    getProductReviews,
    getAverageRating,
  } = useReviews();

  const [rating, setRating] = useState(5);
  const [customerName, setCustomerName] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reviews = useMemo(
    () => getProductReviews(productId),
    [getProductReviews, productId]
  );

  const averageRating = getAverageRating(productId);

  const displayedCustomerName =
    customerName ||
    (accountHydrated ? profile.fullName : "");

  const submitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = displayedCustomerName.trim();
    const cleanComment = comment.trim();

    if (cleanName.length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating.");
      return;
    }

    if (cleanComment.length < 5) {
      setError("Review must contain at least 5 characters.");
      return;
    }

    addReview({
      productId,
      customerName: cleanName,
      rating,
      comment: cleanComment,
    });

    setCustomerName("");
    setComment("");
    setRating(5);
    setError("");
    setSuccess("Review submitted successfully.");

    window.setTimeout(() => {
      setSuccess("");
    }, 2500);
  };

  if (!hydrated) {
    return (
      <section className="h-80 animate-pulse rounded-[24px] bg-white" />
    );
  }

  return (
    <section className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black tracking-[-0.035em] text-[var(--text-primary)]">
            <MessageSquare
              size={20}
              className="text-[var(--primary)]"
            />
            Ratings & reviews
          </h2>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Reviews are currently saved on this device.
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="flex items-center justify-end gap-1 text-xl font-black text-[var(--text-primary)]">
            <Star
              size={18}
              fill="currentColor"
              className="text-[var(--accent)]"
            />
            {reviews.length > 0 ? averageRating : "New"}
          </p>

          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            {reviews.length}{" "}
            {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      <form
        onSubmit={submitReview}
        className="mt-6 rounded-2xl bg-[var(--surface-soft)] p-4"
      >
        <p className="text-sm font-black text-[var(--text-primary)]">
          Write a review
        </p>

        <div className="mt-4 flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            const active = value <= rating;

            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setRating(value);
                  setError("");
                }}
                aria-label={`${value} star rating`}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white"
              >
                <Star
                  size={21}
                  fill={active ? "currentColor" : "none"}
                  className={
                    active
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)]"
                  }
                />
              </button>
            );
          })}
        </div>

        {!profile.fullName && (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
              Your name
            </span>

            <div className="flex h-12 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-3">
              <UserRound
                size={17}
                className="text-[var(--primary)]"
              />

              <input
                value={customerName}
                onChange={(event) => {
                  setCustomerName(event.target.value);
                  setError("");
                }}
                placeholder="Enter your name"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
              />
            </div>
          </label>
        )}

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
            Review
          </span>

          <textarea
            value={comment}
            onChange={(event) => {
              setComment(event.target.value.slice(0, 500));
              setError("");
            }}
            placeholder="Share your experience with this product"
            rows={4}
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-white p-3 text-sm font-medium outline-none focus:border-[var(--primary)]"
          />

          <span className="mt-1 block text-right text-[9px] text-[var(--text-muted)]">
            {comment.length}/500
          </span>
        </label>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-[var(--danger)]">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-[var(--success)]">
            <CheckCircle2 size={15} />
            {success}
          </p>
        )}

        <button
          type="submit"
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-xs font-black text-white"
        >
          <Send size={15} />
          Submit review
        </button>
      </form>

      {reviews.length > 0 ? (
        <div className="mt-6 space-y-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-[var(--border)] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
                  <UserRound size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[var(--text-primary)]">
                        {review.customerName}
                      </p>

                      <div className="mt-1 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={12}
                            fill={
                              index < review.rating
                                ? "currentColor"
                                : "none"
                            }
                            className={
                              index < review.rating
                                ? "text-[var(--accent)]"
                                : "text-[var(--border-strong)]"
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const confirmed = window.confirm(
                          "Remove this review?"
                        );

                        if (confirmed) {
                          removeReview(review.id);
                        }
                      }}
                      aria-label="Remove review"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                    {review.comment}
                  </p>

                  <p className="mt-3 text-[9px] font-semibold text-[var(--text-muted)]">
                    {new Date(review.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border-strong)] p-6 text-center">
          <Star
            size={28}
            className="mx-auto text-[var(--text-muted)]"
          />

          <h3 className="mt-3 text-sm font-black text-[var(--text-primary)]">
            No customer reviews yet
          </h3>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Be the first customer to review this product.
          </p>
        </div>
      )}
    </section>
  );
}