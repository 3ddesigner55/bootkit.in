import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { createRazorpayOrder } from '../services/payment.service';
import { sendSuccess } from '../utils/apiResponse';
import type { RazorpayOrderInput } from '../validators/payment.validator';

export async function createRazorpayOrderController(
  request: Request,
  response: Response,
) {
  const payment = await createRazorpayOrder(
    request.user!.id,
    response.locals.razorpayOrder as RazorpayOrderInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    payment,
    'Razorpay order created successfully.',
  );
}
