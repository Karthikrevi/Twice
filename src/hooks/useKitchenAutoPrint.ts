import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { queryKeys } from "@/lib/queryKeys";
import { useOrders } from "@/hooks/useOrders";
import { useTables } from "@/hooks/useTables";
import { useSession } from "@/store/session";
import { printKitchenTicket } from "@/lib/print";

// TODO: read from /auth/me when the server returns kitchen_output.
// For now this hook is mounted unconditionally and the consumer can
// gate it via the same constant used by KitchenScreen.
export type KitchenOutputMode = "screen" | "printer";

interface Options {
  enabled: boolean;
}

export function useKitchenAutoPrint({ enabled }: Options) {
  const orders = useOrders();
  const tables = useTables();
  const qc = useQueryClient();
  const restaurantName = useSession((s) => s.restaurantName) ?? "Once Restaurant";
  const printedRef = useRef<Set<string>>(new Set());

  // Seed printedRef with whatever's already in the cache so the kitchen
  // doesn't reprint everything on first mount.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !orders.data) return;
    orders.data.forEach((o) => printedRef.current.add(o.id));
    seededRef.current = true;
  }, [orders.data]);

  useEffect(() => {
    if (!enabled) return;
    const sock = getSocket();
    if (!sock) return;

    const handler = async (payload: { id: string }) => {
      if (!payload?.id) return;
      if (printedRef.current.has(payload.id)) return;

      // Refresh the cache so we get the new order, then look it up.
      await qc.invalidateQueries({ queryKey: queryKeys.orders });
      // Allow react-query to refetch before we pull the data.
      setTimeout(() => {
        const fresh = qc.getQueryData<any[]>(queryKeys.orders) ?? [];
        const order = fresh.find((o: any) => o.id === payload.id);
        if (!order || printedRef.current.has(order.id)) return;
        printedRef.current.add(order.id);

        const tableName =
          order.tableId && tables.data
            ? tables.data.find((t) => t.id === order.tableId)?.name
            : undefined;

        printKitchenTicket({
          restaurantName,
          shortId: order.shortId,
          platform: order.platform,
          placedAt: order.placedAt,
          items: order.items.map((it: any) => ({ name: it.name, qty: it.qty })),
          specialInstructions: order.specialInstructions,
          tableName,
          customerName: order.customerName,
          deliveryAddress: order.address,
        }).catch(() => {
          // Printer unavailable or user cancelled — silently swallow.
        });
      }, 250);
    };

    sock.on("order:new", handler);
    return () => {
      sock.off("order:new", handler);
    };
  }, [enabled, qc, restaurantName, tables.data]);
}
