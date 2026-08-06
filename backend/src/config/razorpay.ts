import Razorpay from 'razorpay';

function readRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }

  return value;
}

export const razorpayKeyId = readRequiredEnvironmentVariable('RAZORPAY_KEY_ID');
const razorpayKeySecret = readRequiredEnvironmentVariable(
  'RAZORPAY_KEY_SECRET',
);

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

export default razorpay;
