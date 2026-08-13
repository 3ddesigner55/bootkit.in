import { env } from './env';

type SendOtpInput = {
  phone: string;
  otp: string;
};

export type SmsProvider = {
  sendOtp(input: SendOtpInput): Promise<void>;
};
class ConsoleSmsProvider implements SmsProvider {
  async sendOtp({ phone, otp }: SendOtpInput): Promise<void> {
    console.log("\n================================");
    console.log(`DEV OTP for ${phone}: ${otp}`);
    console.log("================================\n");
  }
}

class HttpSmsProvider implements SmsProvider {
  constructor(
    private readonly endpoint: string,
    private readonly token: string,
    private readonly sender: string,
  ) {}

  async sendOtp({ phone, otp }: SendOtpInput): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        from: this.sender,
        message: `Your BootKit verification code is ${otp}. It expires in 5 minutes.`,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `SMS provider request failed with status ${response.status}.`,
      );
    }
  }
}

const hasRealSmsProvider =
  env.SMS_PROVIDER_URL &&
  env.SMS_PROVIDER_TOKEN &&
  env.SMS_FROM;

export const smsProvider: SmsProvider | null = hasRealSmsProvider
  ? new HttpSmsProvider(
      env.SMS_PROVIDER_URL,
      env.SMS_PROVIDER_TOKEN,
      env.SMS_FROM,
    )
  : process.env.NODE_ENV !== "production"
    ? new ConsoleSmsProvider()
    : null;
