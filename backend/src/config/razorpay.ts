import Razorpay from 'razorpay';

export const razorpayKeyId =
  process.env.RAZORPAY_KEY_ID?.trim() ?? '';

const razorpayKeySecret =
  process.env.RAZORPAY_KEY_SECRET?.trim() ?? '';

export const isRazorpayConfigured = Boolean(
  razorpayKeyId && razorpayKeySecret,
);

const razorpay: Razorpay | null = isRazorpayConfigured
  ? new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })
  : null;

export default razorpay;