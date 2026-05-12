import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { secureStorage } from "@/lib/secureStorage";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useSession } from "@/store/session";
import type { User } from "@/types";

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  restaurantName?: string;
}

const roleHome = (role: User["role"]) => {
  switch (role) {
    case "owner":
      return "/(owner)/";
    case "manager":
      return "/(manager)/";
    case "waiter":
      return "/(waiter)/";
    case "kitchen":
      return "/(kitchen)";
  }
};

export function useLogin() {
  const setUser = useSession((s) => s.setUser);
  const setRestaurantName = useSession((s) => s.setRestaurantName);
  return useMutation({
    mutationFn: async (input: { email: string; password: string; keepLoggedIn: boolean }) => {
      const { data } = await api.post<LoginResponse>("/auth/login", input);
      return { ...data, keepLoggedIn: input.keepLoggedIn };
    },
    onSuccess: async (data) => {
      await Promise.all([
        secureStorage.setAccess(data.accessToken),
        secureStorage.setRefresh(data.refreshToken),
        secureStorage.setUser(data.user),
        secureStorage.setKeepLoggedIn(data.keepLoggedIn),
        data.restaurantName ? secureStorage.setRestaurantName(data.restaurantName) : Promise.resolve(),
      ]);
      connectSocket(data.accessToken);
      setUser(data.user);
      if (data.restaurantName) setRestaurantName(data.restaurantName);
      router.replace(roleHome(data.user.role) as any);
    },
  });
}

export async function logout() {
  disconnectSocket();
  await secureStorage.clearSession();
  useSession.getState().signOut();
  router.replace("/login");
}
