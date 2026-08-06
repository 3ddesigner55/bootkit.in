import type { Role } from '../constants/roles';

export type AuthTokenPayload = {
  userId: string;
  role: Role;
  email?: string;
};

export type AuthenticatedUser = {
  id: string;
  role: Role;
  email?: string;
};

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
