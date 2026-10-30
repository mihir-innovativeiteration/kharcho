import rateLimit from 'express-rate-limit';

/**
 * Sensitive auth endpoints rate limiter (login, register, forgot-password)
 * In test environment, skip to prevent test runner starvation
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
});

/**
 * General API endpoints rate limiter
 */
export const generalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
});

/**
 * AI parsing endpoints rate limiter (prevents provider quota exhaustion)
 */
export const aiParseRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: 'Too many AI parsing requests. Please wait a moment before trying again.',
  },
});
