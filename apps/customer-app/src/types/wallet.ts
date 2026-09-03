export type WalletTransaction = { id: string; type: "CREDIT" | "DEBIT" | "REWARD"; amount: number; points: number; note: string; createdAt: string };
export type WalletState = { balance: number; rewardPoints: number; transactions: WalletTransaction[] };
