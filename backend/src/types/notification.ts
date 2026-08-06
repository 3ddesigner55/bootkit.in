export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export type NotificationResult = {
  sent: boolean;
  messageId?: string;
  error?: string;
};

export type OrderEmailInput = {
  email: string;
  customerName: string;
  orderNumber: string;
};

export type PaymentEmailInput = OrderEmailInput & {
  paymentId?: string;
  failureReason?: string;
};
