import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Missing or malformed Bearer token.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired access token',
    });
  }
}

export const authenticate = requireAuth;
