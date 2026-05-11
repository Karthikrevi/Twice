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
}

const roleHome = (role: User["role"]) => {
  switch (role) {
    case "owner":
      return "/(owner)/orders";
    case "manager":
      return "/(manager)/orders";
    case "waiter":
      return "/(waiter)/tables";
    case "kitchen":
      return "/(kitchen)";
  }
};

export function useLogin() {
  const setUser = useSession((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await api.post<LoginResponse>("/auth/login", input);
      return data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        secureStorage.setAccess(data.accessToken),
        secureStorage.setRefresh(data.refreshToken),
        secureStorage.setUser(data.user),
      ]);
      connectSocket(data.accessToken);
      setUser(data.user);
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
