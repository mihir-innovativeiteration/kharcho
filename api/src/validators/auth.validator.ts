import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(70, 'Name too long'),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters'),
  preferredLanguage: z.enum(['en', 'gu', 'hi']).optional().default('en'),
  preferredTheme: z.enum(['light', 'dark']).optional().default('light'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10, 'Google ID token is required'),
  deviceInfo: z.string().optional(),
});

export const facebookAuthSchema = z.object({
  accessToken: z.string().min(10, 'Facebook access token is required'),
  deviceInfo: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20, 'Refresh token is required'),
  deviceInfo: z.string().optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(20, 'Verification token is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});
