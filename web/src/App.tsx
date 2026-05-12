import { useEffect, type ReactNode } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { useSession, type Role } from "@/store/session";
import { storage } from "@/lib/storage";
import { setSessionExpiredHandler } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { User } from "@/store/session";
import Login from "@/screens/Login";
import Onboarding from "@/screens/Onboarding";
import OwnerDashboard from "@/screens/owner/OwnerDashboard";
import StaffManagement from "@/screens/owner/StaffManagement";
import ManagerDashboard from "@/screens/manager/ManagerDashboard";

const ROLE_HOME: Record<Role, string> = {
  owner: "/owner",
  manager: "/manager",
  waiter: "/waiter",
  kitchen: "/kitchen",
};

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

function RootRedirect() {
  const user = useSession((s) => s.user);
  const bootstrapped = useSession((s) => s.bootstrapped);
  if (!bootstrapped) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role]} replace />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  const bootstrapped = useSession((s) => s.bootstrapped);
  if (!bootstrapped) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
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
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Onboarding />} />
      <Route path="/onboarding" element={<Navigate to="/register" replace />} />
      <Route
        path="/owner/staff"
        element={
          <RequireAuth>
            <StaffManagement />
          </RequireAuth>
        }
      />
      <Route
        path="/owner/*"
        element={
          <RequireAuth>
            <OwnerDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/manager/*"
        element={
          <RequireAuth>
            <ManagerDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/waiter/*"
        element={
          <RequireAuth>
            <Placeholder name="Waiter Dashboard" />
          </RequireAuth>
        }
      />
      <Route
        path="/kitchen"
        element={
          <RequireAuth>
            <Placeholder name="Kitchen Display" />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Placeholder name="404" />} />
    </Routes>
  );
}
