import { io, type Socket } from "socket.io-client";
import { storage } from "./storage";

let socket: Socket | null = null;

const url =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000";

export function connectSocket(accessToken: string) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(url, {
    auth: (cb: (data: { token: string }) => void) => {
      const fresh = storage.getAccess();
      cb({ token: fresh ?? accessToken });
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
