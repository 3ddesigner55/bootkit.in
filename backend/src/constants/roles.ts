export const ROLES = {
  ADMIN: 'ADMIN',
  OWNER: 'OWNER',
  CUSTOMER: 'CUSTOMER',
  DELIVERY: 'DELIVERY',
} as const;

export const ROLE_VALUES = Object.values(ROLES);

export type Role = (typeof ROLES)[keyof typeof ROLES];
