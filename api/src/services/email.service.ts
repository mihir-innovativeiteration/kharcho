import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<void>;
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}

class EmailService implements IEmailService {
  public lastSentEmail: EmailOptions | null = null;
  private transporter: Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
      const port = env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587;
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    this.lastSentEmail = options;

    // 1. If Resend API Key is configured, use Resend API
    if (env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM,
            to: [options.to],
            subject: options.subject,
            text: options.text,
            html: options.html,
          }),
        });

        if (!response.ok) {
          const errData = await response.text();
          console.error('❌ Resend email dispatch failed:', errData);
        } else {
          console.log(`✅ Email sent via Resend to ${options.to}`);
          return;
        }
      } catch (e) {
        console.error('❌ Resend request error:', e);
      }
    }

    // 2. If SMTP is configured, send via Nodemailer transporter
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        console.log(`✅ Email sent via SMTP to ${options.to}`);
        return;
      } catch (e) {
        console.error('❌ SMTP dispatch failed:', e);
      }
    }

    // 3. Fallback / Console Dispatch
    if (env.NODE_ENV !== 'test') {
      console.log(`\n📧 [EMAIL DISPATCH (${env.EMAIL_PROVIDER || 'console'})]`);
      console.log(`From: ${env.EMAIL_FROM}`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.text}\n`);
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const link = `${env.EMAIL_VERIFICATION_BASE_URL}?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: 'Verify your Kharcho account',
      text: `Welcome to Kharcho! Please verify your email address by opening the following link: ${link}\n\nSecurity Token: ${token}\n\nThis link will expire in 24 hours.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #059669;">Welcome to Kharcho!</h2>
          <p>Please verify your email address to secure your account:</p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">Or use this verification token: <code>${token}</code></p>
          <p style="color: #9ca3af; font-size: 12px;">This link will expire in 24 hours.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const link = `${env.PASSWORD_RESET_BASE_URL}?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: 'Reset your Kharcho password',
      text: `You requested a password reset for your Kharcho account.\n\nOpen this link to set a new password: ${link}\n\nYour Reset Token: ${token}\n\nIf you did not request this, you can safely ignore this email. This token will expire in 1 hour.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #059669;">Reset Your Password</h2>
          <p>We received a request to reset the password for your Kharcho account.</p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </p>
          <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px; color: #4b5563;">Reset Token for Mobile App:</p>
            <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 15px; font-weight: bold; color: #111827; word-break: break-all;">${token}</p>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  }
}

export const emailService: IEmailService = new EmailService();
