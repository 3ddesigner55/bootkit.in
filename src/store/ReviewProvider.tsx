"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ProductReview,
  ReviewContextValue,
  ReviewInput,
} from "@/types/review";

export const ReviewContext =
  createContext<ReviewContextValue | null>(null);

const STORAGE_KEY = "bootkit_product_reviews_v1";
const MAX_REVIEWS = 500;

function createReviewId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `review_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function isValidReview(value: unknown): value is ProductReview {
  if (!value || typeof value !== "object") return false;

  const review = value as Partial<ProductReview>;

  return (
    typeof review.id === "string" &&
    typeof review.productId === "string" &&
    typeof review.customerName === "string" &&
    typeof review.rating === "number" &&
    typeof review.comment === "string" &&
    typeof review.createdAt === "string"
  );
}

function readStoredReviews(): ProductReview[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isValidReview)
      .slice(0, MAX_REVIEWS);
  } catch {
    return [];
  }
}

export default function ReviewProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReviews(readStoredReviews());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(reviews)
      );
    } catch {
      // Local storage failure should not break the app.
    }
  }, [reviews, hydrated]);

  const addReview = useCallback((input: ReviewInput) => {
    const now = new Date().toISOString();

    const review: ProductReview = {
      id: createReviewId(),
      productId: input.productId,
      customerName: input.customerName.trim(),
      rating: Math.min(Math.max(input.rating, 1), 5),
      comment: input.comment.trim(),
      verifiedPurchase: false,
      createdAt: now,
      updatedAt: now,
    };

    setReviews((current) =>
      [review, ...current].slice(0, MAX_REVIEWS)
    );

    return review;
  }, []);

  const removeReview = useCallback((reviewId: string) => {
    setReviews((current) =>
      current.filter((review) => review.id !== reviewId)
    );
  }, []);

  const getProductReviews = useCallback(
    (productId: string) =>
      reviews.filter((review) => review.productId === productId),
    [reviews]
  );

  const getAverageRating = useCallback(
    (productId: string) => {
      const productReviews = reviews.filter(
        (review) => review.productId === productId
      );

      if (productReviews.length === 0) return 0;

      const total = productReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );

      return Number((total / productReviews.length).toFixed(1));
    },
    [reviews]
  );

  const clearReviews = useCallback(() => {
    setReviews([]);
  }, []);

  const value = useMemo<ReviewContextValue>(
    () => ({
      reviews,
      hydrated,
      addReview,
      removeReview,
      getProductReviews,
      getAverageRating,
      clearReviews,
    }),
    [
      reviews,
      hydrated,
      addReview,
      removeReview,
      getProductReviews,
      getAverageRating,
      clearReviews,
    ]
  );

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}