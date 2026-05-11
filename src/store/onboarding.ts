import { create } from "zustand";

export interface StaffDraft {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "manager" | "waiter" | "kitchen";
}

export interface MenuDraft {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface OnboardingState {
  step: number;
  restaurantName: string;
  location: string;
  ownerEmail: string;
  ownerPassword: string;
  tableCount: number;
  kitchenOutput: "screen" | "printer";
  menu: MenuDraft[];
  deliveryHeroToken: string;
  deliverooConnected: boolean;
  staff: StaffDraft[];
  set: (patch: Partial<OnboardingState>) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  addMenuItem: (item: MenuDraft) => void;
  removeMenuItem: (id: string) => void;
  addStaff: (s: StaffDraft) => void;
  removeStaff: (id: string) => void;
}

const initial = {
  step: 0,
  restaurantName: "",
  location: "",
  ownerEmail: "",
  ownerPassword: "",
  tableCount: 8,
  kitchenOutput: "screen" as const,
  menu: [] as MenuDraft[],
  deliveryHeroToken: "",
  deliverooConnected: false,
  staff: [] as StaffDraft[],
};

export const useOnboarding = create<OnboardingState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  next: () => set((s) => ({ step: Math.min(s.step + 1, 4) })),
  prev: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
  reset: () => set(initial),
  addMenuItem: (item) => set((s) => ({ menu: [...s.menu, item] })),
  removeMenuItem: (id) => set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),
  addStaff: (st) => set((s) => ({ staff: [...s.staff, st] })),
  removeStaff: (id) => set((s) => ({ staff: s.staff.filter((x) => x.id !== id) })),
}));
