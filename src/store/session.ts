import { create } from "zustand";
import type { Role, User } from "@/types";

interface SessionState {
  user: User | null;
  setupDone: boolean;
  bootstrapped: boolean;
  restaurantName: string | null;
  setUser: (user: User | null) => void;
  setSetupDone: (done: boolean) => void;
  setBootstrapped: (b: boolean) => void;
  setRestaurantName: (name: string | null) => void;
  signOut: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  setupDone: false,
  bootstrapped: false,
  restaurantName: null,
  setUser: (user) => set({ user }),
  setSetupDone: (setupDone) => set({ setupDone }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
  setRestaurantName: (restaurantName) => set({ restaurantName }),
  signOut: () => set({ user: null }),
  hasRole: (...roles) => {
    const u = get().user;
    return !!u && roles.includes(u.role);
  },
}));
