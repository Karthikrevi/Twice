import { Redirect, Stack } from "expo-router";
import { useSession } from "@/store/session";
import { useSocketSync } from "@/hooks/useSocketSync";
import { useKitchenAutoPrint } from "@/hooks/useKitchenAutoPrint";

// TODO: read from /auth/me kitchen_output once the server returns it.
// Mirrors the constant inside src/screens/kitchen/KitchenScreen.tsx.
const KITCHEN_OUTPUT: "screen" | "printer" = "screen";

export default function KitchenLayout() {
  const role = useSession((s) => s.user?.role);
  useSocketSync();
  useKitchenAutoPrint({ enabled: KITCHEN_OUTPUT === "printer" });
  if (!role) return <Redirect href="/login" />;
  if (role !== "kitchen") return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D0F14" },
      }}
    />
  );
}
