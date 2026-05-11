import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { secureStorage } from "@/lib/secureStorage";
import { useOnboarding } from "@/store/onboarding";

export function useSubmitOnboarding() {
  return useMutation({
    mutationFn: async () => {
      const s = useOnboarding.getState();
      const payload = {
        restaurant: {
          name: s.restaurantName.trim(),
          location: s.location.trim(),
          kitchenOutput: s.kitchenOutput,
          tableCount: s.tableCount,
        },
        owner: {
          name: s.ownerEmail.split("@")[0] || "Owner",
          email: s.ownerEmail.trim(),
          password: s.ownerPassword,
        },
        menu: s.menu.map((m) => ({
          name: m.name,
          priceCents: Math.round(m.price * 100),
          stock: m.stock,
        })),
        staff: s.staff.map((m) => ({
          name: m.name,
          email: m.email,
          password: m.password,
          role: m.role,
        })),
        platforms: {
          deliveryHeroToken: s.deliveryHeroToken || undefined,
          deliverooToken: s.deliverooConnected ? "deliveroo-oauth-pending" : undefined,
        },
      };
      const { data } = await api.post<{ restaurantId: string }>("/setup", payload);
      return data;
    },
    onSuccess: async () => {
      await secureStorage.markSetupDone();
      const name = useOnboarding.getState().restaurantName.trim();
      if (name) await secureStorage.setRestaurantName(name);
    },
  });
}
