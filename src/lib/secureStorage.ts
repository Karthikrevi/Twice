import * as SecureStore from "expo-secure-store";

const ACCESS = "once.access";
const REFRESH = "once.refresh";
const USER = "once.user";
const SETUP_DONE = "once.setup_done";

export const secureStorage = {
  async setAccess(token: string) {
    await SecureStore.setItemAsync(ACCESS, token);
  },
  async getAccess() {
    return SecureStore.getItemAsync(ACCESS);
  },
  async setRefresh(token: string) {
    await SecureStore.setItemAsync(REFRESH, token);
  },
  async getRefresh() {
    return SecureStore.getItemAsync(REFRESH);
  },
  async setUser(user: unknown) {
    await SecureStore.setItemAsync(USER, JSON.stringify(user));
  },
  async getUser<T = unknown>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(USER);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async markSetupDone() {
    await SecureStore.setItemAsync(SETUP_DONE, "1");
  },
  async isSetupDone() {
    return (await SecureStore.getItemAsync(SETUP_DONE)) === "1";
  },
  async clearSession() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS),
      SecureStore.deleteItemAsync(REFRESH),
      SecureStore.deleteItemAsync(USER),
    ]);
  },
};
