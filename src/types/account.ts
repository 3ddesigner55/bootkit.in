export type CustomerProfile = {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
};

export type UserRole = "CUSTOMER" | "ADMIN";

export type AuthSession = {
  email: string;
  role: UserRole;
  authenticatedAt: string;
};

export type AccountContextValue = {
  profile: CustomerProfile;
  hydrated: boolean;
  updateProfile: (profile: CustomerProfile) => void;
  clearProfile: () => void;
  session: AuthSession | null;
  register: (profile: CustomerProfile, password: string) => Promise<{ success: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
};
