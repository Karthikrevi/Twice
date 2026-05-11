import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { queryKeys } from "@/lib/queryKeys";

export function useSocketSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    const onNew = () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders });
    };
    const onStatus = () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders });
    };
    sock.on("order:new", onNew);
    sock.on("order:status", onStatus);
    sock.on("connect_error", () => {
      // surface via Sentry in future; silently ignore here
    });
    return () => {
      sock.off("order:new", onNew);
      sock.off("order:status", onStatus);
    };
  }, [qc]);
}
