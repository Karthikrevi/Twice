import { Redirect, Stack } from "expo-router";
import { useSession } from "@/store/session";
import { useSocketSync } from "@/hooks/useSocketSync";

export default function ManagerLayout() {
  const role = useSession((s) => s.user?.role);
  useSocketSync();
  if (!role) return <Redirect href="/login" />;
  if (role !== "manager") return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D0F14" },
      }}
    />
  );
}
