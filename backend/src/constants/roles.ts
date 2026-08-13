export const ROLES = {
  ADMIN: 'ADMIN',
  OWNER: 'OWNER',
  SELLER: 'SELLER',
  CUSTOMER: 'CUSTOMER',
  DELIVERY: 'DELIVERY',
  RIDER: 'RIDER',
} as const;

export const ROLE_VALUES = Object.values(ROLES);

export type Role = (typeof ROLES)[keyof typeof ROLES];
