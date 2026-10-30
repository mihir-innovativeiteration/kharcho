import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id || (res.getHeader('X-Request-Id') as string) || undefined;
  const statusCode = err.statusCode || (err.message?.includes('not found') ? 404 : 400);

  // Mask database details, stack traces, and internal ORM messages
  const isInternalError =
    err.message?.includes('Prisma') ||
    err.message?.includes('SQL') ||
    err.message?.includes('database') ||
    err.name === 'PrismaClientKnownRequestError' ||
    err.name === 'PrismaClientUnknownRequestError' ||
    statusCode >= 500;

  const safeErrorMessage = isInternalError
    ? 'An unexpected server error occurred. Please try again.'
    : err.message || 'Bad Request';

  // Log server errors for observability without leaking secrets or sensitive fields
  if (statusCode >= 500 && env.NODE_ENV !== 'test') {
    console.error(`[ERROR] [Req: ${requestId || 'unknown'}] ${req.method} ${req.originalUrl}:`, {
      name: err.name,
      message: err.message,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: safeErrorMessage,
    ...(requestId ? { requestId } : {}),
  });
}
