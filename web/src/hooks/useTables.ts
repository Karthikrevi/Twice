import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { mapTable } from "@/lib/adapters";
import type { RestaurantTable } from "@/types";

export function useTables() {
  return useQuery({
    queryKey: queryKeys.tables,
    queryFn: async () => {
      const { data } = await api.get<any[]>("/tables");
      return data.map(mapTable) as RestaurantTable[];
    },
    staleTime: 10_000,
  });
}

export function useOpenTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, guests }: { id: string; guests: number }) => {
      const { data } = await api.post<{ sessionId: string }>(
        `/tables/${id}/open`,
        { guests }
      );
      return data;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.tables }),
  });
}
