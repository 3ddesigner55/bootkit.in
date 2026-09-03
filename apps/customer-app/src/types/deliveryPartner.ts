export type DeliveryPartnerStatus = "PENDING" | "ACTIVE" | "OFFLINE";
export type DeliveryPartner = { id: string; name: string; phone: string; status: DeliveryPartnerStatus; available: boolean; earnings: number; assignedOrderNumbers: string[] };
