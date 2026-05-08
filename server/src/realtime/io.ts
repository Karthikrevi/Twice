import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import { verifyAccess } from "../lib/jwt";

let io: IOServer | null = null;

export function initSocket(server: HTTPServer) {
  io = new IOServer(server, { cors: { origin: "*" } });
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("unauthorized"));
    try {
      const payload = verifyAccess(token);
      (socket.data as any).auth = payload;
      socket.join(`r:${payload.rid}`);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });
  return io;
}

export function emitToRestaurant(restaurantId: string, event: string, payload: unknown) {
  io?.to(`r:${restaurantId}`).emit(event, payload);
}
