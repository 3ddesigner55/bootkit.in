import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { processRazorpayWebhook } from '../services/webhook.service';
import { sendSuccess } from '../utils/apiResponse';

function getWebhookSignature(request: Request): string {
  const signature = request.headers['x-razorpay-signature'];

  return Array.isArray(signature) ? '' : (signature ?? '');
}

export async function razorpayWebhookController(
  request: Request,
  response: Response,
) {
  const rawBody = Buffer.isBuffer(request.body)
    ? request.body
    : Buffer.alloc(0);
  const result = await processRazorpayWebhook(
    rawBody,
    getWebhookSignature(request),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'Webhook processed successfully.',
  );
}
