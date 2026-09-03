let memoryAccessToken = "";
let memoryRefreshToken = "";

const ACCESS_TOKEN_STORAGE_KEY = "bk_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "bk_refresh_token";

export function getSecureAccessToken(): string | null {
  if (memoryAccessToken) return memoryAccessToken;
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
      if (stored) {
        memoryAccessToken = stored;
        return stored;
      }
    } catch {}
  }
  return null;
}

export function setSecureAccessToken(token: string) {
  memoryAccessToken = token;
  if (typeof window !== "undefined") {
    try {
      if (token) {
        window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
      } else {
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      }
    } catch {}
  }
}

export function clearSecureAccessToken() {
  memoryAccessToken = "";
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    } catch {}
  }
}

export async function getSecureRefreshToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    // Check if we are running under Capacitor with native platforms (iOS/Android)
    const cap = (window as any).Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
      try {
        const SecureStorage = cap.Plugins?.SecureStorage || cap.Plugins?.SecureStoragePlugin;
        if (SecureStorage) {
          const res = await SecureStorage.get({ key: "bk_refresh_token" });
          if (res.value) {
            memoryRefreshToken = res.value;
            return res.value;
          }
        }
      } catch (e) {
        console.warn("SecureStorage.get failed, using fallback:", e);
      }
    }

    try {
      const stored = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      if (stored) {
        memoryRefreshToken = stored;
        return stored;
      }
    } catch {}
  }
  return memoryRefreshToken || null;
}

export async function setSecureRefreshToken(token: string): Promise<void> {
  memoryRefreshToken = token;
  if (typeof window !== "undefined") {
    const cap = (window as any).Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
      try {
        const SecureStorage = cap.Plugins?.SecureStorage || cap.Plugins?.SecureStoragePlugin;
        if (SecureStorage) {
          await SecureStorage.set({ key: "bk_refresh_token", value: token });
          return;
        }
      } catch (e) {
        console.warn("SecureStorage.set failed:", e);
      }
    }

    try {
      if (token) {
        window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
      } else {
        window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
    } catch {}
  }
}

export async function clearSecureRefreshToken(): Promise<void> {
  memoryRefreshToken = "";
  if (typeof window !== "undefined") {
    const cap = (window as any).Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
      try {
        const SecureStorage = cap.Plugins?.SecureStorage || cap.Plugins?.SecureStoragePlugin;
        if (SecureStorage) {
          await SecureStorage.remove({ key: "bk_refresh_token" });
          return;
        }
      } catch (e) {
        console.warn("SecureStorage.remove failed:", e);
      }
    }

    try {
      window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    } catch {}
  }
}
