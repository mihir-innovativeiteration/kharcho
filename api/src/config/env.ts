import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().transform((val) => parseInt(val, 10)).default('900'), // 15 mins
  REFRESH_TOKEN_TTL: z.string().transform((val) => parseInt(val, 10)).default('2592000'), // 30 days
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_ANDROID_CLIENT_ID: z.string().default(''),
  GOOGLE_IOS_CLIENT_ID: z.string().default(''),
  GOOGLE_WEB_CLIENT_ID: z.string().default(''),
  FACEBOOK_APP_ID: z.string().default(''),
  FACEBOOK_APP_SECRET: z.string().default(''),
  CORS_ORIGINS: z.string().default('http://localhost:8081,http://10.0.2.2:8081'),
  EMAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
  EMAIL_FROM: z.string().default('Kharcho <no-reply@kharcho.app>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  PASSWORD_RESET_BASE_URL: z.string().default('kharcho://reset-password'),
  EMAIL_VERIFICATION_BASE_URL: z.string().default('kharcho://verify-email'),
  GEMINI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
