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

class ConsoleEmailService implements IEmailService {
  public lastSentEmail: EmailOptions | null = null;

  async sendEmail(options: EmailOptions): Promise<void> {
    this.lastSentEmail = options;
    if (env.NODE_ENV !== 'test') {
      console.log(`\n📧 [EMAIL DISPATCH (${env.EMAIL_PROVIDER})]`);
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
      text: `Welcome to Kharcho! Please verify your email address by opening the following link: ${link}\n\nThis link will expire in 24 hours.`,
      html: `<p>Welcome to Kharcho!</p><p>Please <a href="${link}">click here to verify your email address</a>.</p><p>This link expires in 24 hours.</p>`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const link = `${env.PASSWORD_RESET_BASE_URL}?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: 'Reset your Kharcho password',
      text: `You requested a password reset for your Kharcho account. Open this link to set a new password: ${link}\n\nIf you did not request this, you can safely ignore this email. This link will expire in 1 hour.`,
      html: `<p>You requested a password reset for your Kharcho account.</p><p><a href="${link}">Click here to reset your password</a>.</p><p>If you did not request this, you can safely ignore this email.</p>`,
    });
  }
}

export const emailService: IEmailService = new ConsoleEmailService();
