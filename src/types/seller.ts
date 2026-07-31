export type SellerStatus = "PENDING" | "APPROVED" | "SUSPENDED";
export type Seller = { id: string; businessName: string; ownerName: string; email: string; phone: string; commissionRate: number; status: SellerStatus; createdAt: string };
