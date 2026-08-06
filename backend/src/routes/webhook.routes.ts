import { Router } from 'express';

import { razorpayWebhookController } from '../controllers/webhook.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const webhookRoutes = Router();

webhookRoutes.post('/razorpay', asyncHandler(razorpayWebhookController));
