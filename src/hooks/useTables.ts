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

export function useTableSession(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.tableSession(sessionId ?? "none"),
    queryFn: async () => {
      const { data } = await api.get(`/tables/sessions/${sessionId}`);
      return data as {
        id: string;
        guests: number;
        totalCents: number;
        items: { id: string; name: string; qty: number; priceCents: number }[];
      };
    },
    enabled: !!sessionId,
  });
}

export function useOpenTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, guests }: { id: string; guests: number }) => {
      const { data } = await api.post<{ sessionId: string }>(`/tables/${id}/open`, { guests });
      return data;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.tables }),
  });
}

export function useAddSessionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      menuItemId,
      name,
      qty,
      priceCents,
    }: {
      sessionId: string;
      menuItemId: string;
      name: string;
      qty: number;
      priceCents: number;
    }) => {
      await api.post(`/tables/sessions/${sessionId}/items`, { menuItemId, name, qty, priceCents });
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.tableSession(vars.sessionId) });
      qc.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}

export function useCloseSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      splits,
    }: {
      sessionId: string;
      splits: { amountCents: number; method: "cash" | "card" | "wallet" }[];
    }) => {
      await api.post(`/tables/sessions/${sessionId}/close`, { splits });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tables });
      qc.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
}
