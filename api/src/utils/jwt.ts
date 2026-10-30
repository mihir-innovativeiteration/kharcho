import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
}

export interface DecodedAccessToken extends AccessTokenPayload {
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

const JWT_ISSUER = 'kharcho-api';
const JWT_AUDIENCE = 'kharcho-mobile';

/**
 * Generate a short-lived signed JWT access token
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_TTL,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: 'HS256',
  };

  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, options);
}

/**
 * Verify JWT access token with strict algorithm, issuer, and audience validation
 */
export function verifyAccessToken(token: string): DecodedAccessToken {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as DecodedAccessToken;
}
