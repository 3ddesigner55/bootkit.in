import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { verifyRazorpayPayment } from '../services/paymentVerification.service';
import { sendSuccess } from '../utils/apiResponse';
import type { RazorpayPaymentVerificationInput } from '../validators/paymentVerification.validator';

export async function verifyRazorpayPaymentController(
  request: Request,
  response: Response,
) {
  const order = await verifyRazorpayPayment(
    request.user!.id,
    response.locals
      .razorpayPaymentVerification as RazorpayPaymentVerificationInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    order,
    'Payment verified successfully.',
  );
}
