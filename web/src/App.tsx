import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useSession } from "@/store/session";
import { storage } from "@/lib/storage";
import { setSessionExpiredHandler } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { User } from "@/store/session";

function Placeholder({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-bg text-text-primary flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <p className="text-amber font-semibold text-sm tracking-[10px] mb-3">
          O N C E
        </p>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">{name}</h1>
        <p className="text-text-secondary text-sm">
          Foundation ready · screens not yet built
        </p>
      </div>
    </div>
  );
}

export default function App() {
  // Hydrate session + bootstrap socket + wire session-expired handler.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      disconnectSocket();
      useSession.getState().signOut();
      storage.clearSession();
    });

    const access = storage.getAccess();
    const user = storage.getUser<User>();
    const restaurantName = storage.getRestaurantName();
    const setupDone = storage.isSetupDone();
    const keep = storage.isKeepLoggedIn();

    const s = useSession.getState();
    s.setSetupDone(setupDone);
    s.setRestaurantName(restaurantName);

    if (keep && user) {
      s.setUser(user);
      if (access) connectSocket(access);
    } else if (!keep) {
      storage.clearSession();
      s.setUser(null);
    }
    s.setBootstrapped(true);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Placeholder name="Once Web" />} />
      <Route path="/login" element={<Placeholder name="Login" />} />
      <Route path="/onboarding" element={<Placeholder name="Onboarding" />} />
      <Route path="/owner/*" element={<Placeholder name="Owner Dashboard" />} />
      <Route path="/manager/*" element={<Placeholder name="Manager Dashboard" />} />
      <Route path="/waiter/*" element={<Placeholder name="Waiter Dashboard" />} />
      <Route path="/kitchen" element={<Placeholder name="Kitchen Display" />} />
      <Route path="*" element={<Placeholder name="404" />} />
    </Routes>
  );
}
