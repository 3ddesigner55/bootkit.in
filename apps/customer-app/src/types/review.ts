export type ProductReview = {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReviewInput = {
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
};

export type ReviewContextValue = {
  reviews: ProductReview[];
  hydrated: boolean;
  addReview: (input: ReviewInput) => ProductReview;
  removeReview: (reviewId: string) => void;
  getProductReviews: (productId: string) => ProductReview[];
  getAverageRating: (productId: string) => number;
  clearReviews: () => void;
};