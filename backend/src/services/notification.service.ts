import { mailFrom, mailTransporter } from '../config/mail';
import { logger } from '../config/logger';
import type {
  NotificationResult,
  OrderEmailInput,
  PaymentEmailInput,
  SendEmailInput,
} from '../types/notification';

export async function sendEmail(
  input: SendEmailInput,
): Promise<NotificationResult> {
  if (!mailTransporter || !mailFrom) {
    logger.warn('Email notification skipped because SMTP is not configured.', {
      to: input.to,
      subject: input.subject,
    });

    return { sent: false, error: 'SMTP is not configured.' };
  }

  try {
    const result = await mailTransporter.sendMail({
      from: mailFrom,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });

    return { sent: true, messageId: result.messageId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown SMTP error.';

    logger.error('Email notification failed.', {
      to: input.to,
      subject: input.subject,
      error: errorMessage,
    });

    return { sent: false, error: errorMessage };
  }
}

export function sendNotificationAsync(
  notification: Promise<NotificationResult>,
  notificationType: string,
): void {
  void notification
    .then((result) => {
      if (!result.sent) {
        logger.warn('Notification was not sent.', {
          notificationType,
          error: result.error,
        });
      }
    })
    .catch((error: unknown) => {
      logger.error('Notification execution failed.', {
        notificationType,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown notification error.',
      });
    });
}

export function sendOrderPlacedEmail(
  input: OrderEmailInput,
): Promise<NotificationResult> {
  return sendEmail({
    to: input.email,
    subject: `BootKit order placed: ${input.orderNumber}`,
    text: `Hello ${input.customerName},\n\nYour order ${input.orderNumber} has been placed successfully.\n\nThank you,\nBootKit`,
  });
}

export function sendOrderCancelledEmail(
  input: OrderEmailInput,
): Promise<NotificationResult> {
  return sendEmail({
    to: input.email,
    subject: `BootKit order cancelled: ${input.orderNumber}`,
    text: `Hello ${input.customerName},\n\nYour order ${input.orderNumber} has been cancelled.\n\nThank you,\nBootKit`,
  });
}

export function sendPaymentSuccessEmail(
  input: PaymentEmailInput,
): Promise<NotificationResult> {
  return sendEmail({
    to: input.email,
    subject: `BootKit payment successful: ${input.orderNumber}`,
    text: `Hello ${input.customerName},\n\nPayment for order ${input.orderNumber} was successful.${input.paymentId ? ` Payment ID: ${input.paymentId}.` : ''}\n\nThank you,\nBootKit`,
  });
}

export function sendPaymentFailedEmail(
  input: PaymentEmailInput,
): Promise<NotificationResult> {
  return sendEmail({
    to: input.email,
    subject: `BootKit payment failed: ${input.orderNumber}`,
    text: `Hello ${input.customerName},\n\nPayment for order ${input.orderNumber} failed.${input.failureReason ? ` Reason: ${input.failureReason}.` : ''}\n\nPlease try again.\nBootKit`,
  });
}
