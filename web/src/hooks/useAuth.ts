import { storage } from "@/lib/storage";
import { disconnectSocket } from "@/lib/socket";
import { useSession } from "@/store/session";

export function logout(navigate: (path: string) => void) {
  disconnectSocket();
  storage.clearSession();
  useSession.getState().signOut();
  navigate("/login");
}
