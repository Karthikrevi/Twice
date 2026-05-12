import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { PlatformKey } from "@/types";

export interface DailyReport {
  byPlatform: {
    platform: PlatformKey;
    gross: number;
    commission: number;
    net: number;
    rate: number;
  }[];
  tills: Partial<Record<"cash" | "card" | "wallet", number>>;
}

export function useDailyReport() {
  return useQuery({
    queryKey: queryKeys.reports,
    queryFn: async () => (await api.get<DailyReport>("/reports/daily")).data,
    staleTime: 60_000,
  });
}
