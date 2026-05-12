// Web-side mirror of the native app's SecureStore wrapper. The web app
// uses localStorage; sensitive deployments should layer this behind an
// httpOnly refresh cookie at the proxy.

const KEYS = {
  access: "once.access",
  refresh: "once.refresh",
  user: "once.user",
  setupDone: "once.setup_done",
  keepLoggedIn: "once.keep_logged_in",
  restaurantName: "once.restaurant_name",
};

export const storage = {
  getAccess: () => localStorage.getItem(KEYS.access),
  setAccess: (v: string) => localStorage.setItem(KEYS.access, v),
  getRefresh: () => localStorage.getItem(KEYS.refresh),
  setRefresh: (v: string) => localStorage.setItem(KEYS.refresh, v),
  getUser: <T = unknown>(): T | null => {
    const raw = localStorage.getItem(KEYS.user);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  setUser: (u: unknown) => localStorage.setItem(KEYS.user, JSON.stringify(u)),

  isSetupDone: () => localStorage.getItem(KEYS.setupDone) === "1",
  markSetupDone: () => localStorage.setItem(KEYS.setupDone, "1"),

  isKeepLoggedIn: () => localStorage.getItem(KEYS.keepLoggedIn) === "1",
  setKeepLoggedIn: (v: boolean) => {
    if (v) localStorage.setItem(KEYS.keepLoggedIn, "1");
    else localStorage.removeItem(KEYS.keepLoggedIn);
  },

  getRestaurantName: () => localStorage.getItem(KEYS.restaurantName),
  setRestaurantName: (v: string) => localStorage.setItem(KEYS.restaurantName, v),

  clearSession: () => {
    localStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.refresh);
    localStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.keepLoggedIn);
  },
};
