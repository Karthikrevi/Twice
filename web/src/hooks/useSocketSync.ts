import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { queryKeys } from "@/lib/queryKeys";

export function useSocketSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    const handler = () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders });
    };
    sock.on("order:new", handler);
    sock.on("order:status", handler);
    return () => {
      sock.off("order:new", handler);
      sock.off("order:status", handler);
    };
  }, [qc]);
}
