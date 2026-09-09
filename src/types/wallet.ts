export type WalletTransactionType = "CREDIT" | "DEBIT" | "REWARD" | "REFUND";

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amount: number;
  points?: number;
  note: string;
  createdAt: string;
  status?: "SUCCESS" | "PENDING" | "FAILED";
  orderId?: string;
  paymentMethod?: string;
  closingBalance?: number;
};

export type WalletState = {
  balance: number;
  rewardPoints: number;
  transactions: WalletTransaction[];
};

export type WalletContextValue = WalletState & {
  addMoney: (amount: number, note?: string, paymentMethod?: string) => boolean;
  deductMoney: (amount: number, note?: string, orderId?: string) => boolean;
  addReward: (points: number, note: string) => void;
};

