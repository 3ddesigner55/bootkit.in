export type CustomerProfile = {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
};

export type UserRole = "OWNER" | "ADMIN" | "SELLER" | "CUSTOMER" | "DELIVERY";

export type LocalUser = {
  profile: CustomerProfile;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
};

export type AuthSession = {
  email: string;
  role: UserRole;
  authenticatedAt: string;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
};

export type AccountContextValue = {
  profile: CustomerProfile;
  hydrated: boolean;
  updateProfile: (profile: CustomerProfile) => void;
  clearProfile: () => void;
  session: AuthSession | null;
  users: LocalUser[];
  register: (profile: CustomerProfile, password: string) => Promise<{ success: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUserRole: (email: string, role: UserRole) => { success: boolean; message: string };
};
