import nodemailer, { type Transporter } from 'nodemailer';

type MailConfiguration = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

function getMailConfiguration(): MailConfiguration | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const port = Number(process.env.SMTP_PORT ?? 587);

  if (!host || !user || !pass || !from || !Number.isInteger(port) || port < 1) {
    return null;
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    user,
    pass,
    from,
  };
}

const mailConfiguration = getMailConfiguration();

export const mailTransporter: Transporter | null = mailConfiguration
  ? nodemailer.createTransport({
      host: mailConfiguration.host,
      port: mailConfiguration.port,
      secure: mailConfiguration.secure,
      auth: {
        user: mailConfiguration.user,
        pass: mailConfiguration.pass,
      },
    })
  : null;

export const mailFrom = mailConfiguration?.from ?? '';
