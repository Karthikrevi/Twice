import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import { secureStorage } from "./secureStorage";

const baseURL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "http://localhost:4000";

export const api = axios.create({ baseURL, timeout: 12_000 });

let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

api.interceptors.request.use(async (config) => {
  const access = await secureStorage.getAccess();
  if (access) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await secureStorage.getRefresh();
  if (!refresh) return null;
  try {
    const r = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: refresh }, { timeout: 8000 });
    const access = r.data?.accessToken as string | undefined;
    if (!access) return null;
    await secureStorage.setAccess(access);
    return access;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    const isAuthRoute =
      typeof original?.url === "string" &&
      (original.url.includes("/auth/login") || original.url.includes("/auth/refresh"));

    if (status === 401 && !original?._retry && !isAuthRoute) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newAccess = await refreshing;
      refreshing = null;
      if (newAccess) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
        return api.request(original);
      }
      await secureStorage.clearSession();
      onSessionExpired?.();
    }
    throw error;
  }
);
