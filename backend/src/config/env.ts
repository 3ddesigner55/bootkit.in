import { cleanEnv, port, str, url } from 'envalid';

const isDevelopment = process.env.NODE_ENV === 'development';
const externalServiceString = isDevelopment ? str({ default: '' }) : str();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
  PORT: port({ default: 5001 }),
  MONGODB_URI: str(),
  DB_NAME: str(),
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_ACCESS_EXPIRES_IN: str(),
  JWT_REFRESH_EXPIRES_IN: str(),
  CLOUDINARY_CLOUD_NAME: externalServiceString,
  CLOUDINARY_API_KEY: externalServiceString,
  CLOUDINARY_API_SECRET: externalServiceString,
  RAZORPAY_KEY_ID: externalServiceString,
  RAZORPAY_KEY_SECRET: externalServiceString,
  RAZORPAY_WEBHOOK_SECRET: externalServiceString,
  SMS_PROVIDER_URL: externalServiceString,
  SMS_PROVIDER_TOKEN: externalServiceString,
  SMS_FROM: externalServiceString,
  FRONTEND_URL: url(),
});

if (env.NODE_ENV === 'development') {
  const developmentServiceValues = {
    CLOUDINARY_CLOUD_NAME: 'development-cloudinary-not-configured',
    CLOUDINARY_API_KEY: 'development-cloudinary-not-configured',
    CLOUDINARY_API_SECRET: 'development-cloudinary-not-configured',
    RAZORPAY_KEY_ID: 'development-razorpay-not-configured',
    RAZORPAY_KEY_SECRET: 'development-razorpay-not-configured',
    RAZORPAY_WEBHOOK_SECRET: 'development-razorpay-not-configured',
    SMS_PROVIDER_URL: 'development-sms-not-configured',
    SMS_PROVIDER_TOKEN: 'development-sms-not-configured',
    SMS_FROM: 'development-sms-not-configured',
  };

  for (const [name, value] of Object.entries(developmentServiceValues)) {
    if (!process.env[name]) {
      process.env[name] = value;
    }
  }
}
