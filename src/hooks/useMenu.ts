import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { mapMenuItem } from "@/lib/adapters";
import type { MenuItem } from "@/types";

export function useMenu() {
  return useQuery({
    queryKey: queryKeys.menu,
    queryFn: async () => {
      const { data } = await api.get<any[]>("/menu");
      return data.map(mapMenuItem) as MenuItem[];
    },
    staleTime: 30_000,
  });
}

export function useToggleAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      await api.patch(`/menu/${id}/availability`, { available });
    },
    onMutate: async ({ id, available }) => {
      await qc.cancelQueries({ queryKey: queryKeys.menu });
      const previous = qc.getQueryData<MenuItem[]>(queryKeys.menu);
      if (previous) {
        qc.setQueryData<MenuItem[]>(
          queryKeys.menu,
          previous.map((m) => (m.id === id ? { ...m, available } : m))
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.menu, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.menu }),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await api.patch(`/menu/${id}/stock`, { quantity });
    },
    onMutate: async ({ id, quantity }) => {
      await qc.cancelQueries({ queryKey: queryKeys.menu });
      const previous = qc.getQueryData<MenuItem[]>(queryKeys.menu);
      if (previous) {
        qc.setQueryData<MenuItem[]>(
          queryKeys.menu,
          previous.map((m) => (m.id === id ? { ...m, stock: Math.max(0, quantity) } : m))
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.menu, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.menu }),
  });
}
