import jwt, { type SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { ROLE_VALUES, type Role } from '../constants/roles';
import type { AuthTokenPayload } from '../types/auth';

function signToken(
  payload: AuthTokenPayload,
  secret: string,
  expiresIn: string,
): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  });
}

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLE_VALUES.includes(value as Role);
}

function verifyToken(token: string, secret: string): AuthTokenPayload {
  const decoded = jwt.verify(token, secret);

  if (
    typeof decoded === 'string' ||
    typeof decoded.userId !== 'string' ||
    !isRole(decoded.role)
  ) {
    throw new jwt.JsonWebTokenError('Invalid token payload.');
  }

  return {
    userId: decoded.userId,
    role: decoded.role,
    ...(typeof decoded.email === 'string' ? { email: decoded.email } : {}),
  };
}

export function generateAccessToken(payload: AuthTokenPayload): string {
  return signToken(payload, jwtConfig.accessSecret, jwtConfig.accessExpiresIn);
}

export function generateRefreshToken(payload: AuthTokenPayload): string {
  return signToken(
    payload,
    jwtConfig.refreshSecret,
    jwtConfig.refreshExpiresIn,
  );
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return verifyToken(token, jwtConfig.accessSecret);
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return verifyToken(token, jwtConfig.refreshSecret);
}
