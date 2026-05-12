import { create } from "zustand";

export type Role = "owner" | "manager" | "waiter" | "kitchen";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface SessionState {
  user: User | null;
  restaurantName: string | null;
  setupDone: boolean;
  bootstrapped: boolean;
  setUser: (u: User | null) => void;
  setRestaurantName: (n: string | null) => void;
  setSetupDone: (b: boolean) => void;
  setBootstrapped: (b: boolean) => void;
  signOut: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  restaurantName: null,
  setupDone: false,
  bootstrapped: false,
  setUser: (user) => set({ user }),
  setRestaurantName: (restaurantName) => set({ restaurantName }),
  setSetupDone: (setupDone) => set({ setupDone }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
  signOut: () => set({ user: null }),
  hasRole: (...roles) => {
    const u = get().user;
    return !!u && roles.includes(u.role);
  },
}));
