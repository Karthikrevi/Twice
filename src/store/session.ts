import { create } from "zustand";
import type { Role, User, RestaurantProfile } from "@/types";

interface SessionState {
  user: User | null;
  restaurant: RestaurantProfile | null;
  setUser: (user: User | null) => void;
  setRestaurant: (r: RestaurantProfile | null) => void;
  signOut: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  restaurant: null,
  setUser: (user) => set({ user }),
  setRestaurant: (restaurant) => set({ restaurant }),
  signOut: () => set({ user: null }),
  hasRole: (...roles) => {
    const u = get().user;
    return !!u && roles.includes(u.role);
  },
}));
