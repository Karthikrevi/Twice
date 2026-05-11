import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import { secureStorage } from "./secureStorage";

let socket: Socket | null = null;

const url =
  (Constants.expoConfig?.extra?.socketUrl as string | undefined) ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:4000";

export function connectSocket(accessToken: string) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(url, {
    auth: async (cb: (data: { token: string }) => void) => {
      const fresh = await secureStorage.getAccess();
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
