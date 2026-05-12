import { useQuery } from "@tanstack/react-query";
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
