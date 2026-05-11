import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface PlatformRow {
  platform: "talabat" | "deliveroo" | "instashop";
  status: "connected" | "issue" | "disconnected";
  commission_rate: number;
  updated_at: string;
}

export function usePlatforms() {
  return useQuery({
    queryKey: queryKeys.platforms,
    queryFn: async () => (await api.get<PlatformRow[]>("/platforms")).data,
  });
}

export function useUpsertPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      platform: "talabat" | "deliveroo" | "instashop";
      token: string;
      commissionRate?: number;
    }) => {
      await api.post("/platforms", input);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.platforms }),
  });
}

export function useDisconnectPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (platform: PlatformRow["platform"]) => {
      await api.delete(`/platforms/${platform}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.platforms }),
  });
}
