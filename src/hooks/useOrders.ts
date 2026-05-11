import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { mapOrder } from "@/lib/adapters";
import type { Order, OrderStatus } from "@/types";

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: async () => {
      const { data } = await api.get<any[]>("/orders");
      return data.map(mapOrder) as Order[];
    },
    staleTime: 10_000,
  });
}

export function useAdvanceOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      await api.patch(`/orders/${id}/status`, { status });
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.orders });
      const previous = qc.getQueryData<Order[]>(queryKeys.orders);
      if (previous) {
        qc.setQueryData<Order[]>(
          queryKeys.orders,
          previous.map((o) => (o.id === id ? { ...o, status } : o))
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.orders, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.orders }),
  });
}
